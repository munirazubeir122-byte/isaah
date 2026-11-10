import { useEffect, useState } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { api, errorText } from './api';
import { AutoTextarea, Button, Card, Field, inputCls, PageTitle, StatusLine, type Status } from './ui';
import { LANGS, STRINGS, type Lang } from '../i18n';
import { ABOUT, CONTACT_PAGE } from '../data/pages';
import { LIES, REGION_INFO } from '../data/episodes';
import { CONTACT } from '../data/contact';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const LANG_NAMES: Record<Lang, string> = { EN: 'English', SO: 'Somali', SW: 'Swahili', FR: 'French', PT: 'Portuguese' };

const SECTIONS = {
  strings: { label: 'Home page, menus and buttons', shipped: (l: Lang) => STRINGS[l] },
  about: { label: 'About page', shipped: (l: Lang) => ABOUT[l] ?? ABOUT.EN },
  contact: { label: 'Contact page', shipped: (l: Lang) => CONTACT_PAGE[l] ?? CONTACT_PAGE.EN },
  lies: { label: 'Recruitment lies (home page)', shipped: (l: Lang) => LIES[l] ?? LIES.EN },
  regions: { label: 'Region descriptions (home page)', shipped: (l: Lang) => REGION_INFO[l] ?? REGION_INFO.EN },
} as const;
type SectionKey = keyof typeof SECTIONS;

/** "heroTitle" → "Hero title" */
const human = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).toLowerCase().replace(/^./, (c) => c.toUpperCase());

/** An empty copy of a value, used when adding an item to a list. */
function blank(v: Json): Json {
  if (typeof v === 'string') return '';
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return v;
}

/**
 * Edits any piece of page text, whatever its shape: single texts, lists of
 * paragraphs, lists of title/body cards, or groups of named texts.
 */
function FormEditor({ value, onChange, label, filter = '' }: { value: Json; onChange: (v: Json) => void; label?: string; filter?: string }) {
  if (typeof value === 'string') {
    return label ? (
      <Field label={label}>
        <AutoTextarea value={value} onChange={onChange} minRows={1} />
      </Field>
    ) : (
      <AutoTextarea value={value} onChange={onChange} minRows={1} />
    );
  }
  if (Array.isArray(value)) {
    const template = value[0] ?? '';
    return (
      <fieldset className="space-y-3 rounded-lg border border-moss/60 p-3">
        {label && <legend className="px-1 text-xs font-semibold tracking-wide text-sage uppercase">{label}</legend>}
        {value.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <FormEditor value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
            </div>
            <button aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))} className="mt-2 text-sage hover:text-exit">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button variant="ghost" onClick={() => onChange([...value, blank(template)])}>
          <Plus className="h-4 w-4" aria-hidden /> Add
        </Button>
      </fieldset>
    );
  }
  if (value && typeof value === 'object') {
    const q = filter.trim().toLowerCase();
    const entries = Object.entries(value).filter(
      ([k, v]) => !q || k.toLowerCase().includes(q) || human(k).toLowerCase().includes(q) || JSON.stringify(v).toLowerCase().includes(q),
    );
    return (
      <div className="space-y-4">
        {label && <div className="text-xs font-semibold tracking-wide text-sage uppercase">{label}</div>}
        {entries.map(([k, v]) => (
          <FormEditor key={k} label={human(k)} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        ))}
        {!entries.length && <p className="text-sm text-sage">Nothing matches your search.</p>}
      </div>
    );
  }
  return null;
}

export function TextEditor() {
  const [section, setSection] = useState<SectionKey>('strings');
  const [lang, setLang] = useState<Lang>('EN');
  const [docs, setDocs] = useState<Record<string, Json> | null>(null);
  const [value, setValue] = useState<Json>(null);
  const [dirty, setDirty] = useState(false);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<Status>(null);

  const key = `${section}:${lang}`;

  useEffect(() => {
    api<{ docs: Record<string, Json> }>('admin/content')
      .then((c) => setDocs(c.docs))
      .catch((e) => setStatus({ kind: 'error', text: errorText(e) }));
  }, []);

  useEffect(() => {
    if (!docs) return;
    const shipped = SECTIONS[section].shipped(lang) as unknown as Json;
    const edited = docs[key];
    // Edits are laid over the shipped text, so fields added later still appear.
    const merged =
      edited && !Array.isArray(edited) && typeof edited === 'object' && shipped && typeof shipped === 'object' && !Array.isArray(shipped)
        ? { ...shipped, ...edited }
        : (edited ?? shipped);
    setValue(structuredClone(merged));
    setDirty(false);
    setStatus(null);
  }, [docs, key, section, lang]);

  const pick = (fn: () => void) => {
    if (dirty && !window.confirm('You have unsaved changes. Leave them?')) return;
    fn();
  };

  const save = async () => {
    try {
      await api(`admin/docs/${key}`, { method: 'PUT', body: value });
      setDocs({ ...docs, [key]: value });
      setStatus({ kind: 'ok', text: 'Saved. The change is live on the site.' });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };

  const reset = async () => {
    if (!window.confirm('Go back to the original text for this section and language? Your edits here will be lost.')) return;
    try {
      await api(`admin/docs/${key}`, { method: 'DELETE' });
      const next = { ...docs };
      delete next[key];
      setDocs(next);
      setStatus({ kind: 'ok', text: 'Back to the original text.' });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };

  return (
    <>
      <PageTitle sub="Edit the wording on the site. Languages without their own text show English until you fill them in.">Page text</PageTitle>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Field label="Section">
          <select className={inputCls} value={section} onChange={(e) => pick(() => setSection(e.target.value as SectionKey))}>
            {Object.entries(SECTIONS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Language">
          <select className={inputCls} value={lang} onChange={(e) => pick(() => setLang(e.target.value as Lang))}>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="sticky top-0 z-20 -mx-1 mb-4 flex flex-wrap items-center gap-3 bg-night/95 px-1 py-3 backdrop-blur">
        <Button variant="primary" onClick={save} disabled={!dirty}>
          {dirty ? 'Save changes' : 'Saved'}
        </Button>
        {docs?.[key] !== undefined && (
          <Button variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Back to original
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <StatusLine status={status} />
        </div>
      </div>
      <Card>
        {section === 'strings' && (
          <div className="mb-5">
            <input className={inputCls} placeholder="Search, e.g. 'hero' or a word on the page" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        )}
        {value === null ? (
          <p className="text-sm text-sage">Loading…</p>
        ) : (
          <FormEditor
            value={value}
            filter={section === 'strings' ? filter : ''}
            onChange={(v) => {
              setValue(v);
              setDirty(true);
            }}
          />
        )}
      </Card>
    </>
  );
}

export function ContactEditor() {
  const [form, setForm] = useState({ ...CONTACT });
  const [status, setStatus] = useState<Status>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    api<{ docs: Record<string, Json> }>('admin/content')
      .then((c) => setForm({ ...CONTACT, ...((c.docs.settings as object) ?? {}) }))
      .catch((e) => setStatus({ kind: 'error', text: errorText(e) }));
  }, []);
  const set = (k: keyof typeof CONTACT, v: string) => {
    setForm({ ...form, [k]: v });
    setDirty(true);
  };
  const save = async () => {
    try {
      await api('admin/docs/settings', { method: 'PUT', body: form });
      setDirty(false);
      setStatus({ kind: 'ok', text: 'Saved. The Contact page now shows these details.' });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };
  return (
    <>
      <PageTitle sub="Shown on the Contact page. Leave a box empty to hide that option.">Contact details</PageTitle>
      <Card>
        <div className="max-w-xl space-y-4">
          <Field label="Email for everyone" hint="Shown at the top of the Contact page, e.g. info@islaah.co.ke">
            <input className={inputCls} type="email" value={form.generalEmail} onChange={(e) => set('generalEmail', e.target.value)} />
          </Field>
          <Field label="Encrypted email for stories" hint="Optional, e.g. a Proton Mail address.">
            <input className={inputCls} type="email" value={form.storiesEmail} onChange={(e) => set('storiesEmail', e.target.value)} />
          </Field>
          <Field label="Signal number" hint="Optional. International format, e.g. +254 700 000 000. Use a number kept only for ISLAAH.">
            <input className={inputCls} value={form.signal} onChange={(e) => set('signal', e.target.value)} />
          </Field>
          <StatusLine status={status} />
          <Button variant="primary" onClick={save} disabled={!dirty}>
            {dirty ? 'Save' : 'Saved'}
          </Button>
        </div>
      </Card>
    </>
  );
}
