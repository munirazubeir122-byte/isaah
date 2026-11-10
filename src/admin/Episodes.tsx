import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { api, errorText, type Me } from './api';
import { AutoTextarea, Button, Card, Field, inputCls, PageTitle, StatusLine, type Status } from './ui';
import { uploadAudio, uploadImage } from './media';
import { goto } from './AdminApp';
import { IMAGES, type ImageKey } from '../data/images';
import { REGIONS } from '../data/episodes';
import { LANGS, STRINGS, type Lang } from '../i18n';
import { ACT_KEYS, type EpisodeRecord, type EpisodeText } from '../content/types';

const LANG_NAMES: Record<Lang, string> = { EN: 'English', SO: 'Somali', SW: 'Swahili', FR: 'French', PT: 'Portuguese' };
const ACT_LABELS: Record<(typeof ACT_KEYS)[number], string> = {
  promise: 'Act 1 · The promise',
  reality: 'Act 2 · The reality',
  breakingPoint: 'Act 3 · The breaking point',
  return: 'Act 4 · The return',
};
const regionName = (id: string) => STRINGS.EN[REGIONS.find((r) => r.id === id)?.labelKey ?? 'regionKenya'] ?? id;

async function loadEpisodes(): Promise<EpisodeRecord[]> {
  const c = await api<{ episodes: EpisodeRecord[] }>('admin/content');
  return [...c.episodes].sort((a, b) => a.sort - b.sort);
}

const saveEpisode = (r: EpisodeRecord) => api<EpisodeRecord>(`admin/episodes/${r.id}`, { method: 'PUT', body: r });

// ------------------------------------------------------------------ list

export function EpisodeList({ me }: { me: Me }) {
  const [list, setList] = useState<EpisodeRecord[] | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const reload = () =>
    loadEpisodes()
      .then(setList)
      .catch((e) => setStatus({ kind: 'error', text: errorText(e) }));
  useEffect(() => {
    void reload();
  }, []);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setStatus({ kind: 'info', text: 'Saving…' });
    try {
      await fn();
      await reload();
      setStatus({ kind: 'ok', text: ok });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    if (!list) return;
    const a = list[i];
    const b = list[i + dir];
    if (!b) return;
    void run(async () => {
      await saveEpisode({ ...a, sort: b.sort });
      await saveEpisode({ ...b, sort: a.sort });
    }, 'Order saved.');
  };

  const create = () =>
    run(async () => {
      const rec = await api<EpisodeRecord>('admin/episodes', { method: 'POST' });
      goto(`/episodes/${rec.id}`);
    }, 'Story created.');

  return (
    <>
      <PageTitle sub="Click Edit to change a story's text, picture or audio. Hide takes a story off the site but keeps it; Delete removes it for good. Changes appear on the site as soon as you save.">Stories</PageTitle>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={create}>
          <Plus className="h-4 w-4" aria-hidden /> New story
        </Button>
        <div className="min-w-0 flex-1">
          <StatusLine status={status} />
        </div>
      </div>
      {!list ? (
        <p className="text-sm text-sage">Loading…</p>
      ) : (
        <div className="space-y-3">
          {list.map((e, i) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-moss/70 bg-panel p-4">
              <div className="flex flex-col">
                <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="text-sage hover:text-snow disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="text-sage hover:text-snow disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <a href={`#/episodes/${e.id}`} className="min-w-0 flex-1">
                <div className="font-serif text-lg font-bold text-snow hover:text-gold">{e.text.EN?.title || '(untitled)'}</div>
                <div className="text-xs text-sage">
                  {regionName(e.region)} · {e.date || 'no date'} · Text: {Object.keys(e.text).join(', ')} · Audio:{' '}
                  {Object.keys(e.audio).join(', ') || 'none'}
                  {e.sample && ' · sample'}
                </div>
              </a>
              <span className={`rounded-full px-2 py-0.5 text-xs ${e.published ? 'bg-forest text-gold' : 'bg-panel-2 text-sage'}`}>
                {e.published ? 'On the site' : 'Hidden'}
              </span>
              <Button onClick={() => run(() => saveEpisode({ ...e, published: !e.published }), e.published ? 'Story hidden.' : 'Story published.')}>
                {e.published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                {e.published ? 'Hide' : 'Publish'}
              </Button>
              <Button onClick={() => goto(`/episodes/${e.id}`)}>
                <Pencil className="h-4 w-4" aria-hidden /> Edit
              </Button>
              {me.role === 'admin' && (
                <Button
                  variant="danger"
                  aria-label={`Delete ${e.text.EN?.title || e.id}`}
                  onClick={() => {
                    const title = e.text.EN?.title || 'this story';
                    if (!window.confirm(`Delete "${title}" for good?

Its text cannot be recovered. To take it off the site but keep it, use "Hide" instead.`)) return;
                    void run(() => api(`admin/episodes/${e.id}`, { method: 'DELETE' }), `"${title}" deleted.`);
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Delete
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ editor

type LangForm = { title: string; hook: string } & Record<(typeof ACT_KEYS)[number], string>;

const toForm = (t?: EpisodeText): LangForm => ({
  title: t?.title ?? '',
  hook: t?.hook ?? '',
  promise: (t?.acts.promise ?? []).join('\n\n'),
  reality: (t?.acts.reality ?? []).join('\n\n'),
  breakingPoint: (t?.acts.breakingPoint ?? []).join('\n\n'),
  return: (t?.acts.return ?? []).join('\n\n'),
});

const paragraphs = (s: string) =>
  s
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const fromForm = (f: LangForm): EpisodeText => ({
  title: f.title.trim(),
  hook: f.hook.trim(),
  acts: { promise: paragraphs(f.promise), reality: paragraphs(f.reality), breakingPoint: paragraphs(f.breakingPoint), return: paragraphs(f.return) },
});

export function EpisodeEditor({ id, me }: { id: string; me: Me }) {
  const [rec, setRec] = useState<EpisodeRecord | null>(null);
  const [forms, setForms] = useState<Partial<Record<Lang, LangForm>>>({});
  const [lang, setLang] = useState<Lang>('EN');
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadEpisodes()
      .then((list) => {
        const r = list.find((e) => e.id === id);
        if (!r) return setStatus({ kind: 'error', text: 'This story does not exist.' });
        setRec(r);
        setForms(Object.fromEntries(Object.entries(r.text).map(([l, t]) => [l, toForm(t)])));
      })
      .catch((e) => setStatus({ kind: 'error', text: errorText(e) }));
  }, [id]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const builtIn = useMemo(() => Object.keys(IMAGES).filter((k) => k.startsWith('story-') || k.startsWith('scene-')) as ImageKey[], []);

  if (!rec) return <StatusLine status={status ?? { kind: 'info', text: 'Loading…' }} />;

  const update = (patch: Partial<EpisodeRecord>) => {
    setRec({ ...rec, ...patch });
    setDirty(true);
  };
  const setField = (k: keyof LangForm, v: string) => {
    setForms({ ...forms, [lang]: { ...(forms[lang] ?? toForm()), [k]: v } });
    setDirty(true);
  };

  const save = async () => {
    const text: EpisodeRecord['text'] = {};
    for (const [l, f] of Object.entries(forms) as [Lang, LangForm][]) if (f.title.trim() || f.hook.trim()) text[l] = fromForm(f);
    if (!text.EN?.title) return setStatus({ kind: 'error', text: 'Please give the story an English title before saving.' });
    setBusy(true);
    setStatus({ kind: 'info', text: 'Saving…' });
    try {
      const saved = await saveEpisode({ ...rec, text });
      setRec(saved);
      setDirty(false);
      setStatus({ kind: 'ok', text: saved.published ? 'Saved. The change is live on the site.' : 'Saved. This story is hidden from the site.' });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this story for good? Its text cannot be recovered. (To take it off the site but keep it, use "Hide" instead.)')) return;
    try {
      await api(`admin/episodes/${rec.id}`, { method: 'DELETE' });
      setDirty(false);
      goto('/episodes');
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };

  const onImage = async (file?: File) => {
    if (!file) return;
    setStatus({ kind: 'info', text: 'Preparing and uploading the image…' });
    try {
      const up = await uploadImage(file);
      update({ image: { ...up, alt: typeof rec.image === 'object' ? rec.image.alt : '' } });
      setStatus({ kind: 'ok', text: 'Image uploaded. Add a short description, then Save.' });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };

  const onAudio = async (file?: File) => {
    if (!file) return;
    setStatus({ kind: 'info', text: `Uploading ${LANG_NAMES[lang]} audio… (large files take a minute)` });
    try {
      const a = await uploadAudio(file);
      update({ audio: { ...rec.audio, [lang]: a } });
      setStatus({ kind: 'ok', text: `${LANG_NAMES[lang]} audio uploaded (${Math.round(a.seconds / 60)} min). Remember to Save.` });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };

  const f = forms[lang] ?? toForm();
  const audio = rec.audio[lang];
  const custom = typeof rec.image === 'object' ? rec.image : null;

  return (
    <>
      <div className="mb-2">
        <a href="#/episodes" className="text-sm text-sage hover:text-snow">
          ← All stories
        </a>
      </div>
      <PageTitle>{forms.EN?.title || 'Untitled story'}</PageTitle>

      <div className="sticky top-0 z-20 -mx-1 mb-6 flex flex-wrap items-center gap-3 bg-night/95 px-1 py-3 backdrop-blur">
        <Button variant="primary" onClick={save} disabled={busy || !dirty}>
          {busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={rec.published} onChange={(e) => update({ published: e.target.checked })} />
          Show on the site
        </label>
        <div className="min-w-0 flex-1">
          <StatusLine status={status} />
        </div>
      </div>

      <div className="space-y-6">
        <Card title="Details">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Region">
              <select className={inputCls} value={rec.region} onChange={(e) => update({ region: e.target.value as EpisodeRecord['region'] })}>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {regionName(r.id)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Place" hint="Broad area only, e.g. 'Cabo Delgado'. Never a village or street.">
              <input className={inputCls} value={rec.subRegion} onChange={(e) => update({ subRegion: e.target.value })} />
            </Field>
            <Field label="Date" hint="e.g. 'March 2026'">
              <input className={inputCls} value={rec.date} onChange={(e) => update({ date: e.target.value })} />
            </Field>
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm text-mist">
            <input type="checkbox" className="mt-1" checked={rec.sample} onChange={(e) => update({ sample: e.target.checked })} />
            <span>
              <strong className="text-snow">Sample story.</strong> Tick this for illustrative stories that are not a verified testimony. The site then shows a
              notice saying so.
            </span>
          </label>
        </Card>

        <Card title="Picture">
          <p className="mb-3 text-sm text-mist">Choose one of the illustrations, or upload your own.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {builtIn.map((k) => (
              <button
                key={k}
                onClick={() => update({ image: k })}
                className={`overflow-hidden rounded-lg border-2 ${rec.image === k ? 'border-gold' : 'border-transparent hover:border-moss'}`}
                aria-label={IMAGES[k].alt}
                aria-pressed={rec.image === k}
              >
                <img src={IMAGES[k].sm} alt="" className="aspect-[16/10] w-full object-cover" />
              </button>
            ))}
            {custom && (
              <div className="overflow-hidden rounded-lg border-2 border-gold">
                <img src={custom.sm} alt="" className="aspect-[16/10] w-full object-cover" />
              </div>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-exit/50 bg-exit/10 p-3 text-xs text-mist">
            <strong className="text-snow">Protect your sources:</strong> never upload a photo showing a face, body, tattoo, clothing, document, phone screen or a
            place that could identify someone. Uploads are re-saved in your browser first, which removes hidden data such as GPS location.
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-moss bg-panel-2 px-4 py-2 text-sm hover:border-gold">
              <Upload className="h-4 w-4" aria-hidden /> Upload a picture
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onImage(e.target.files?.[0])} />
            </label>
            {custom && (
              <div className="min-w-64 flex-1">
                <Field label="Describe the picture" hint="For blind visitors. Describe objects and places, never people's identities.">
                  <input className={inputCls} value={custom.alt} onChange={(e) => update({ image: { ...custom, alt: e.target.value } })} />
                </Field>
              </div>
            )}
          </div>
        </Card>

        <Card title="Story text and audio">
          <div className="mb-5 flex flex-wrap gap-2" role="tablist">
            {LANGS.map((l) => (
              <button
                key={l}
                role="tab"
                aria-selected={lang === l}
                onClick={() => setLang(l)}
                className={`rounded-lg px-3 py-1.5 text-sm ${lang === l ? 'bg-gold font-bold text-ink' : 'border border-moss text-mist hover:text-snow'}`}
              >
                {LANG_NAMES[l]}
                {forms[l]?.title ? '' : ' (empty)'}
              </button>
            ))}
          </div>
          {lang !== 'EN' && !forms[lang]?.title && (
            <p className="mb-4 text-sm text-sage">
              No {LANG_NAMES[lang]} version yet: visitors reading in {LANG_NAMES[lang]} see the English story. Fill in the fields below to add a translation.
            </p>
          )}
          <div className="space-y-4">
            <Field label="Title">
              <input className={inputCls} value={f.title} onChange={(e) => setField('title', e.target.value)} />
            </Field>
            <Field label="Opening quote" hint="The short quote shown on the story's card.">
              <AutoTextarea value={f.hook} onChange={(v) => setField('hook', v)} />
            </Field>
            {ACT_KEYS.map((k) => (
              <Field key={k} label={ACT_LABELS[k]} hint="Leave an empty line between paragraphs.">
                <AutoTextarea value={f[k]} onChange={(v) => setField(k, v)} minRows={5} />
              </Field>
            ))}
            {lang !== 'EN' && forms[lang]?.title && (
              <Button
                variant="ghost"
                onClick={() => {
                  const next = { ...forms };
                  delete next[lang];
                  setForms(next);
                  setDirty(true);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Remove the {LANG_NAMES[lang]} text
              </Button>
            )}
          </div>

          <div className="mt-6 border-t border-moss/50 pt-5">
            <h3 className="mb-2 font-semibold text-snow">{LANG_NAMES[lang]} narration</h3>
            {audio ? (
              <div className="flex flex-wrap items-center gap-3">
                <audio controls preload="none" src={audio.src} className="max-w-full" />
                <span className="text-sm text-sage">
                  {Math.floor(audio.seconds / 60)}:{String(audio.seconds % 60).padStart(2, '0')}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = { ...rec.audio };
                    delete next[lang];
                    update({ audio: next });
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Remove
                </Button>
              </div>
            ) : (
              <p className="text-sm text-sage">No {LANG_NAMES[lang]} audio{lang !== 'EN' ? ': listeners hear the English one, if there is one.' : '.'}</p>
            )}
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-moss bg-panel-2 px-4 py-2 text-sm hover:border-gold">
              <Upload className="h-4 w-4" aria-hidden /> {audio ? 'Replace' : 'Upload'} {LANG_NAMES[lang]} audio (MP3)
              <input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,.mp3,.m4a,.ogg" className="sr-only" onChange={(e) => onAudio(e.target.files?.[0])} />
            </label>
            <p className="mt-2 text-xs text-sage">Only upload narration read by a narrator or synthetic voice, never a source's real voice.</p>
          </div>
        </Card>

        {me.role === 'admin' && (
          <Card title="Delete">
            <p className="mb-3 text-sm text-mist">Deleting removes this story for good. To take it off the site but keep it, untick "Show on the site" instead.</p>
            <Button variant="danger" onClick={remove}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete this story
            </Button>
          </Card>
        )}
      </div>
    </>
  );
}
