// Passwords, sessions and invite tokens for the admin dashboard.
//
// Passwords: HMAC-SHA256 with a server-side secret (the "pepper", kept as a
// Worker secret, never in the database), then PBKDF2-SHA256 with a random
// salt per user. A stolen database alone cannot be used to guess passwords.
// The iteration count is stored with each hash so it can be raised later
// (the free Workers plan limits CPU time per request).
import type { Env } from './env';

const ITERATIONS = 20_000;
const SESSION_HOURS = 12;
export const COOKIE = '__Host-islaah_s';
export const MIN_PASSWORD = 12;

const enc = new TextEncoder();

export const now = () => Math.floor(Date.now() / 1000);

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function randomToken(bytes = 32): string {
  return b64(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(s: string): Promise<string> {
  return b64(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function derive(password: string, salt: Uint8Array, iterations: number, pepper: string): Promise<Uint8Array> {
  // Never hash without the secret: refuse sign-ins until it is configured.
  if (typeof pepper !== 'string' || pepper.length < 32) throw new Error('PEPPER secret is missing');
  const hmacKey = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const peppered = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(password));
  const baseKey = await crypto.subtle.importKey('raw', peppered, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, baseKey, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string, env: Env): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS, env.PEPPER);
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPassword(password: string, stored: string | null, env: Env): Promise<boolean> {
  if (!stored) {
    // Spend the same time as a real check so timing does not reveal accounts.
    await derive(password, new Uint8Array(16), ITERATIONS, env.PEPPER);
    return false;
  }
  const [scheme, iter, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const actual = await derive(password, unb64(salt), Number(iter), env.PEPPER);
  return sameBytes(actual, unb64(hash));
}

export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 200) return 'That password is too long.';
  return null;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

export async function createSession(env: Env, userId: number): Promise<string> {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, now() + SESSION_HOURS * 3600)
    .run();
  return `${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export const clearCookie = `${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;

function readCookie(req: Request): string | null {
  const header = req.headers.get('Cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=') || null;
  }
  return null;
}

export async function sessionUser(req: Request, env: Env): Promise<(SessionUser & { tokenHash: string }) | null> {
  const token = readCookie(req);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.disabled = 0`,
  )
    .bind(tokenHash, now())
    .first<SessionUser>();
  return row ? { ...row, tokenHash } : null;
}
