// The ISLAAH Worker. Serves the built site from dist/, embeds the editable
// content into the home page, and runs the admin API.
//
//   GET  /                     site, with content embedded
//   GET  /api/content          public content (published episodes + edits)
//   POST /api/hit              anonymous page count (page name only)
//   GET  /media/<key>          uploaded audio and images
//   /api/auth/*                login, logout, invites, password change
//   /api/admin/*               dashboard (signed-in users only)
import { defaultEpisodes } from '../src/content/defaults';
import type { EpisodeRecord, SiteContent } from '../src/content/types';
import { REGIONS } from '../src/data/episodes';
import {
  clearCookie,
  createSession,
  hashPassword,
  now,
  passwordProblem,
  randomToken,
  sessionUser,
  sha256,
  verifyPassword,
  type SessionUser,
} from './auth';
import type { Env } from './env';

const SITE_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const API_CSP = "default-src 'none'; frame-ancestors 'none'";

const INVITE_DAYS = 7;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const REGION_IDS = new Set<string>(REGIONS.map((r) => r.id));

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ------------------------------------------------------------------ helpers

function harden(res: Response, csp = API_CSP): Response {
  const h = new Headers(res.headers);
  h.set('Content-Security-Policy', csp);
  h.set('Referrer-Policy', 'no-referrer');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

async function body<T>(req: Request, maxBytes = 600_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'That is too large to save.');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, 'Invalid request.');
  }
}

const isEmail = (s: unknown): s is string => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
/** Emails arrive with stray spaces from phone keyboards and autofill. */
const cleanEmail = (s: unknown): unknown => (typeof s === 'string' ? s.trim() : s);

async function audit(env: Env, user: SessionUser | string, action: string, target = '') {
  const who = typeof user === 'string' ? user : user.email;
  await env.DB.prepare('INSERT INTO audit (at, user, action, target) VALUES (?, ?, ?, ?)').bind(now(), who, action, target).run();
}

// ------------------------------------------------------------------ content

async function allEpisodes(env: Env): Promise<{ episodes: EpisodeRecord[]; seeded: boolean }> {
  const { results } = await env.DB.prepare('SELECT data FROM episodes ORDER BY sort').all<{ data: string }>();
  if (!results.length) return { episodes: defaultEpisodes(), seeded: false };
  return { episodes: results.map((r) => JSON.parse(r.data) as EpisodeRecord), seeded: true };
}

async function allDocs(env: Env): Promise<Record<string, unknown>> {
  const { results } = await env.DB.prepare('SELECT key, data FROM docs').all<{ key: string; data: string }>();
  return Object.fromEntries(results.map((r) => [r.key, JSON.parse(r.data)]));
}

async function publicContent(env: Env): Promise<SiteContent> {
  const [{ episodes }, docs] = await Promise.all([allEpisodes(env), allDocs(env)]);
  return { episodes: episodes.filter((e) => e.published), docs };
}

/** The first edit copies the shipped episodes into the database. */
async function ensureSeeded(env: Env, by: string) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM episodes').first<{ n: number }>();
  if (row && row.n > 0) return;
  const t = now();
  await env.DB.batch(
    defaultEpisodes().map((e) =>
      env.DB.prepare('INSERT INTO episodes (id, sort, published, data, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)').bind(
        e.id,
        e.sort,
        e.published ? 1 : 0,
        JSON.stringify(e),
        t,
        by,
      ),
    ),
  );
}

function checkEpisode(e: EpisodeRecord, id: string): EpisodeRecord {
  const bad = (m: string) => {
    throw new HttpError(400, m);
  };
  if (!e || typeof e !== 'object') bad('Invalid episode.');
  if (e.id !== id) bad('Episode id does not match.');
  if (!REGION_IDS.has(e.region)) bad('Choose a region.');
  if (!e.text?.EN?.title?.trim()) bad('The English title is required.');
  if (typeof e.sort !== 'number' || !Number.isFinite(e.sort)) bad('Invalid order.');
  if (typeof e.image === 'object' && !(e.image?.sm?.startsWith('/') && e.image?.lg?.startsWith('/'))) bad('Invalid image.');
  for (const a of Object.values(e.audio ?? {})) if (a && !a.src?.startsWith('/')) bad('Invalid audio.');
  return {
    id: e.id,
    sort: e.sort,
    published: !!e.published,
    sample: !!e.sample,
    region: e.region,
    subRegion: String(e.subRegion ?? ''),
    date: String(e.date ?? ''),
    image: e.image,
    text: e.text,
    audio: e.audio ?? {},
  };
}

const DOC_KEY = /^(about|contact|strings|lies|regions):(EN|SO|SW|FR|PT)$|^settings$/;

// ------------------------------------------------------------------ public routes

async function homePage(req: Request, env: Env): Promise<Response> {
  // Drop "has it changed?" headers: the static file never changes, but the
  // content embedded in it does, so the asset server must not answer 304.
  const headers = new Headers(req.headers);
  headers.delete('If-None-Match');
  headers.delete('If-Modified-Since');
  const res = await env.ASSETS.fetch(new Request(req.url, { method: 'GET', headers }));
  if (res.status !== 200 || !(res.headers.get('Content-Type') ?? '').includes('text/html')) return res;
  let content: SiteContent | null = null;
  try {
    content = await publicContent(env);
  } catch (e) {
    console.error('content unavailable', e);
  }
  const out = content
    ? new HTMLRewriter()
        .on('head', {
          element(el) {
            // "<" is escaped so the text can never close the script element.
            const data = JSON.stringify(content).replace(/</g, '\\u003c');
            el.append(`<script type="application/json" id="site-content">${data}</script>`, { html: true });
          },
        })
        .transform(res)
    : res;
  const h = harden(out, SITE_CSP);
  // The page now holds live content, so the static file's validators would
  // make browsers keep a stale copy (304 Not Modified). Never reuse it.
  h.headers.delete('ETag');
  h.headers.delete('Last-Modified');
  h.headers.set('Cache-Control', 'no-store');
  return h;
}

const HIT_PATH = /^\/(about|contact|episode\/[a-z0-9-]{1,40})?$/;

async function hit(req: Request, env: Env): Promise<Response> {
  const path = (await req.text()).trim().slice(0, 80);
  if (HIT_PATH.test(path)) {
    const day = new Date().toISOString().slice(0, 10);
    try {
      await env.DB.prepare('INSERT INTO pageviews (day, path, count) VALUES (?, ?, 1) ON CONFLICT (day, path) DO UPDATE SET count = count + 1')
        .bind(day, path)
        .run();
    } catch (e) {
      console.error('page count failed', e);
    }
  }
  return new Response(null, { status: 204 });
}

async function media(req: Request, env: Env, key: string): Promise<Response> {
  const { value, metadata } = await env.MEDIA.getWithMetadata<{ contentType?: string }>(key, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  const type = metadata?.contentType ?? 'application/octet-stream';
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  };
  // Range support so listeners can skip through audio.
  const range = req.headers.get('Range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const size = value.byteLength;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    return new Response(value.slice(start, end + 1), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}` },
    });
  }
  return new Response(value, { headers });
}

// ------------------------------------------------------------------ auth routes

async function auth(req: Request, env: Env, action: string): Promise<Response> {
  const t = now();

  if (action === 'me' && req.method === 'GET') {
    const u = await sessionUser(req, env);
    if (!u) return json({ user: null });
    return json({ user: { id: u.id, email: u.email, name: u.name, role: u.role } });
  }

  if (action === 'login' && req.method === 'POST') {
    const { email: rawEmail, password } = await body<{ email?: string; password?: string }>(req, 2000);
    const email = cleanEmail(rawEmail);
    const user = isEmail(email)
      ? await env.DB.prepare('SELECT id, email, pw, disabled, failed, locked_until FROM users WHERE email = ?')
          .bind(email.trim())
          .first<{ id: number; email: string; pw: string | null; disabled: number; failed: number; locked_until: number }>()
      : null;
    if (user && user.locked_until > t) {
      const mins = Math.ceil((user.locked_until - t) / 60);
      throw new HttpError(429, `Too many wrong attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
    }
    const ok = await verifyPassword(String(password ?? ''), user && !user.disabled ? user.pw : null, env);
    if (!user || !ok || user.disabled) {
      if (user) {
        const failed = user.failed + 1;
        await env.DB.prepare('UPDATE users SET failed = ?, locked_until = ? WHERE id = ?')
          .bind(failed >= MAX_FAILED ? 0 : failed, failed >= MAX_FAILED ? t + LOCK_MINUTES * 60 : 0, user.id)
          .run();
        if (failed >= MAX_FAILED) await audit(env, user.email, 'account locked after wrong passwords');
      }
      throw new HttpError(401, 'Wrong email or password.');
    }
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET failed = 0, locked_until = 0 WHERE id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
    ]);
    const cookie = await createSession(env, user.id);
    await audit(env, user.email, 'signed in');
    return json({ ok: true }, 200, { 'Set-Cookie': cookie });
  }

  if (action === 'logout' && req.method === 'POST') {
    const u = await sessionUser(req, env);
    if (u) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(u.tokenHash).run();
    return json({ ok: true }, 200, { 'Set-Cookie': clearCookie });
  }

  if (action === 'invite' && req.method === 'GET') {
    const token = new URL(req.url).searchParams.get('token') ?? '';
    const u = await env.DB.prepare('SELECT email, name FROM users WHERE invite_hash = ? AND invite_expires > ? AND disabled = 0')
      .bind(await sha256(token), t)
      .first<{ email: string; name: string }>();
    if (!u) throw new HttpError(404, 'This link has expired or was already used. Ask an admin for a new one.');
    return json(u);
  }

  if (action === 'invite' && req.method === 'POST') {
    const { token, password, name } = await body<{ token?: string; password?: string; name?: string }>(req, 2000);
    const problem = passwordProblem(password);
    if (problem) throw new HttpError(400, problem);
    const u = await env.DB.prepare('SELECT id, email FROM users WHERE invite_hash = ? AND invite_expires > ? AND disabled = 0')
      .bind(await sha256(String(token ?? '')), t)
      .first<{ id: number; email: string }>();
    if (!u) throw new HttpError(404, 'This link has expired or was already used. Ask an admin for a new one.');
    const pw = await hashPassword(password!, env);
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE users SET pw = ?, name = COALESCE(NULLIF(?, ''), name), invite_hash = NULL, invite_expires = NULL, failed = 0, locked_until = 0 WHERE id = ?",
      ).bind(pw, String(name ?? '').slice(0, 80), u.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),
    ]);
    const cookie = await createSession(env, u.id);
    await audit(env, u.email, 'set password');
    return json({ ok: true }, 200, { 'Set-Cookie': cookie });
  }

  if (action === 'password' && req.method === 'POST') {
    const u = await sessionUser(req, env);
    if (!u) throw new HttpError(401, 'Please sign in again.');
    const { current, next } = await body<{ current?: string; next?: string }>(req, 2000);
    const row = await env.DB.prepare('SELECT pw FROM users WHERE id = ?').bind(u.id).first<{ pw: string | null }>();
    if (!(await verifyPassword(String(current ?? ''), row?.pw ?? null, env))) throw new HttpError(400, 'Your current password is not right.');
    const problem = passwordProblem(next);
    if (problem) throw new HttpError(400, problem);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pw = ? WHERE id = ?').bind(await hashPassword(next!, env), u.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),
    ]);
    const cookie = await createSession(env, u.id);
    await audit(env, u, 'changed password');
    return json({ ok: true }, 200, { 'Set-Cookie': cookie });
  }

  throw new HttpError(404, 'Not found.');
}

// ------------------------------------------------------------------ admin routes

async function newInvite(env: Env, userId: number, origin: string): Promise<string> {
  const token = randomToken();
  await env.DB.prepare('UPDATE users SET invite_hash = ?, invite_expires = ? WHERE id = ?')
    .bind(await sha256(token), now() + INVITE_DAYS * 86400, userId)
    .run();
  return `${origin}/admin/#/invite/${token}`;
}

async function activeAdminsExcept(env: Env, id: number): Promise<number> {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND disabled = 0 AND id != ?").bind(id).first<{ n: number }>();
  return r?.n ?? 0;
}

async function admin(req: Request, env: Env, parts: string[], user: SessionUser): Promise<Response> {
  const [area, id, sub] = parts;
  const m = req.method;
  const origin = new URL(req.url).origin;
  const requireAdmin = () => {
    if (user.role !== 'admin') throw new HttpError(403, 'Only admins can do this.');
  };

  // ---- content
  if (area === 'content' && m === 'GET') {
    const [{ episodes, seeded }, docs] = await Promise.all([allEpisodes(env), allDocs(env)]);
    return json({ episodes, docs, seeded });
  }

  if (area === 'episodes' && m === 'POST' && !id) {
    await ensureSeeded(env, user.email);
    const { results } = await env.DB.prepare('SELECT id, sort FROM episodes').all<{ id: string; sort: number }>();
    const nums = results.map((r) => Number(r.id.match(/^ep-(\d+)$/)?.[1] ?? 0));
    const newId = `ep-${String(Math.max(0, ...nums) + 1).padStart(2, '0')}`;
    const rec: EpisodeRecord = {
      id: newId,
      sort: Math.max(0, ...results.map((r) => r.sort)) + 1,
      published: false,
      sample: false,
      region: 'Kenya & Somalia',
      subRegion: '',
      date: '',
      image: 'story-road',
      text: { EN: { title: 'New story', hook: '', acts: { promise: [], reality: [], breakingPoint: [], return: [] } } },
      audio: {},
    };
    await env.DB.prepare('INSERT INTO episodes (id, sort, published, data, updated_at, updated_by) VALUES (?, ?, 0, ?, ?, ?)')
      .bind(rec.id, rec.sort, JSON.stringify(rec), now(), user.email)
      .run();
    await audit(env, user, 'created episode', rec.id);
    return json(rec, 201);
  }

  if (area === 'episodes' && id && m === 'PUT') {
    const rec = checkEpisode(await body<EpisodeRecord>(req), id);
    await ensureSeeded(env, user.email);
    await env.DB.prepare(
      `INSERT INTO episodes (id, sort, published, data, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET sort = excluded.sort, published = excluded.published, data = excluded.data,
         updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    )
      .bind(rec.id, rec.sort, rec.published ? 1 : 0, JSON.stringify(rec), now(), user.email)
      .run();
    await audit(env, user, 'edited episode', `${rec.id} ${rec.text.EN?.title ?? ''}`.trim());
    return json(rec);
  }

  if (area === 'episodes' && id && m === 'DELETE') {
    requireAdmin();
    await ensureSeeded(env, user.email);
    await env.DB.prepare('DELETE FROM episodes WHERE id = ?').bind(id).run();
    await audit(env, user, 'deleted episode', id);
    return json({ ok: true });
  }

  if (area === 'docs' && id && DOC_KEY.test(id)) {
    if (m === 'PUT') {
      const data = await body<unknown>(req, 300_000);
      if (data === null || typeof data !== 'object') throw new HttpError(400, 'Invalid text.');
      await env.DB.prepare(
        'INSERT INTO docs (key, data, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT (key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by',
      )
        .bind(id, JSON.stringify(data), now(), user.email)
        .run();
      await audit(env, user, 'edited text', id);
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      await env.DB.prepare('DELETE FROM docs WHERE key = ?').bind(id).run();
      await audit(env, user, 'reset text to original', id);
      return json({ ok: true });
    }
  }

  // ---- media upload
  if (area === 'media' && m === 'POST') {
    const q = new URL(req.url).searchParams;
    const kind = q.get('kind');
    const ext = (q.get('ext') ?? '').toLowerCase();
    const types: Record<string, Record<string, string>> = {
      audio: { mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg' },
      image: { webp: 'image/webp' },
    };
    const type = kind ? types[kind]?.[ext] : undefined;
    if (!type) throw new HttpError(400, 'Unsupported file type.');
    const data = await req.arrayBuffer();
    const limit = kind === 'audio' ? 24 * 1024 * 1024 : 3 * 1024 * 1024;
    if (data.byteLength > limit) throw new HttpError(413, `The file is too large (limit ${limit / 1024 / 1024} MB).`);
    if (!data.byteLength) throw new HttpError(400, 'The file is empty.');
    const suffix = (q.get('suffix') ?? '').replace(/[^a-z0-9-]/g, '').slice(0, 10);
    const base = q.get('base')?.match(/^[a-f0-9-]{36}$/) ? q.get('base') : crypto.randomUUID();
    const key = `${kind}/${base}${suffix ? '-' + suffix : ''}.${ext}`;
    await env.MEDIA.put(key, data, { metadata: { contentType: type, by: user.email } });
    await audit(env, user, `uploaded ${kind}`, key);
    return json({ src: `/media/${key}`, base });
  }

  // ---- stats and activity
  if (area === 'stats' && m === 'GET') {
    const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get('days') ?? 30)));
    const from = new Date(Date.now() - (days - 1) * 86400_000).toISOString().slice(0, 10);
    const [byDay, byPath, recent] = await env.DB.batch([
      env.DB.prepare('SELECT day, SUM(count) AS views FROM pageviews WHERE day >= ? GROUP BY day ORDER BY day').bind(from),
      env.DB.prepare('SELECT path, SUM(count) AS views FROM pageviews WHERE day >= ? GROUP BY path ORDER BY views DESC LIMIT 20').bind(from),
      env.DB.prepare('SELECT at, user, action, target FROM audit ORDER BY id DESC LIMIT 25'),
    ]);
    return json({ from, days, byDay: byDay.results, byPath: byPath.results, recent: recent.results });
  }

  // ---- users (admins only)
  if (area === 'users') {
    requireAdmin();
    const t = now();
    if (m === 'GET' && !id) {
      const { results } = await env.DB.prepare(
        `SELECT id, email, name, role, disabled, created_at,
                pw IS NOT NULL AS active,
                (invite_expires IS NOT NULL AND invite_expires > ?) AS invite_pending,
                locked_until > ? AS locked
         FROM users ORDER BY created_at`,
      )
        .bind(t, t)
        .all();
      return json(results);
    }
    if (m === 'POST' && !id) {
      const { email: rawEmail, name, role } = await body<{ email?: string; name?: string; role?: string }>(req, 2000);
      const email = cleanEmail(rawEmail);
      if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
      if (role !== 'admin' && role !== 'editor') throw new HttpError(400, 'Choose a role.');
      const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.trim()).first();
      if (exists) throw new HttpError(409, 'There is already an account with that email.');
      const res = await env.DB.prepare('INSERT INTO users (email, name, role, created_at) VALUES (?, ?, ?, ?)')
        .bind(email.trim(), String(name ?? '').slice(0, 80), role, t)
        .run();
      const newId = Number(res.meta.last_row_id);
      const link = await newInvite(env, newId, origin);
      await audit(env, user, `created ${role} account`, email.trim());
      return json({ id: newId, inviteUrl: link }, 201);
    }
    const uid = Number(id);
    if (!Number.isInteger(uid)) throw new HttpError(404, 'Not found.');
    const target = await env.DB.prepare('SELECT id, email, role, disabled FROM users WHERE id = ?')
      .bind(uid)
      .first<{ id: number; email: string; role: string; disabled: number }>();
    if (!target) throw new HttpError(404, 'That account does not exist.');

    if (m === 'POST' && sub === 'invite') {
      const link = await newInvite(env, uid, origin);
      await audit(env, user, 'made a new sign-in link', target.email);
      return json({ inviteUrl: link });
    }
    if (m === 'PATCH') {
      const { role, disabled, name } = await body<{ role?: string; disabled?: boolean; name?: string }>(req, 2000);
      const nextRole = role ?? target.role;
      const nextDisabled = disabled ?? !!target.disabled;
      if (nextRole !== 'admin' && nextRole !== 'editor') throw new HttpError(400, 'Choose a role.');
      const losingAdmin = target.role === 'admin' && !target.disabled && (nextRole !== 'admin' || nextDisabled);
      if (losingAdmin && (await activeAdminsExcept(env, uid)) === 0) throw new HttpError(400, 'There must always be at least one active admin.');
      const stmts = [
        env.DB.prepare('UPDATE users SET role = ?, disabled = ?, name = COALESCE(?, name), locked_until = 0, failed = 0 WHERE id = ?').bind(
          nextRole,
          nextDisabled ? 1 : 0,
          name === undefined ? null : String(name).slice(0, 80),
          uid,
        ),
      ];
      if (nextDisabled) stmts.push(env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(uid));
      await env.DB.batch(stmts);
      await audit(env, user, nextDisabled ? 'disabled account' : `updated account (${nextRole})`, target.email);
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      if (uid === user.id) throw new HttpError(400, 'You cannot delete your own account.');
      if (target.role === 'admin' && !target.disabled && (await activeAdminsExcept(env, uid)) === 0)
        throw new HttpError(400, 'There must always be at least one active admin.');
      await env.DB.batch([
        env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(uid),
        env.DB.prepare('DELETE FROM users WHERE id = ?').bind(uid),
      ]);
      await audit(env, user, 'deleted account', target.email);
      return json({ ok: true });
    }
  }

  throw new HttpError(404, 'Not found.');
}

// ------------------------------------------------------------------ entry

async function route(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if ((path === '/' || path === '/index.html') && req.method === 'GET') return homePage(req, env);
  if (path === '/api/content' && req.method === 'GET') return harden(json(await publicContent(env)));
  if (path === '/api/hit' && req.method === 'POST') return hit(req, env);
  if (path.startsWith('/media/') && (req.method === 'GET' || req.method === 'HEAD')) {
    const key = decodeURIComponent(path.slice('/media/'.length));
    if (!/^(audio|image)\/[a-f0-9-]{36}(-[a-z0-9-]{1,10})?\.[a-z0-9]{2,4}$/.test(key)) return new Response('Not found', { status: 404 });
    return harden(await media(req, env, key), "default-src 'none'");
  }

  const isAuth = path.startsWith('/api/auth/');
  const isAdmin = path.startsWith('/api/admin/');
  if (isAuth || isAdmin) {
    // Requests that change something must come from this site's own pages.
    if (req.method !== 'GET' && req.headers.get('Origin') !== url.origin) throw new HttpError(403, 'Request blocked.');
    if (isAuth) return harden(await auth(req, env, path.slice('/api/auth/'.length)));
    const user = await sessionUser(req, env);
    if (!user) throw new HttpError(401, 'Please sign in.');
    return harden(await admin(req, env, path.slice('/api/admin/'.length).split('/').filter(Boolean), user));
  }

  return env.ASSETS.fetch(req);
}

export default {
  async fetch(req, env): Promise<Response> {
    try {
      return await route(req, env);
    } catch (e) {
      if (e instanceof HttpError) return harden(json({ error: e.message }, e.status));
      console.error(e);
      return harden(json({ error: 'Something went wrong on the server. Please try again.' }, 500));
    }
  },
} satisfies ExportedHandler<Env>;
