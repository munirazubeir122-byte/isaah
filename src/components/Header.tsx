import { useState } from 'react';
import { Globe, Menu, X } from 'lucide-react';
import { LANGS, type Lang, type Strings } from '../i18n';

/** Separate pages. */
export type PageId = 'about' | 'contact';
/** Sections of the home page. */
export type SectionId = 'episodes' | 'interviews' | 'regions';
export type NavTarget = 'home' | PageId | SectionId;

interface Props {
  t: Strings;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  onNavigate: (target: NavTarget) => void;
  active: NavTarget | null;
}

export function Header({ t, lang, onLangChange, onNavigate, active }: Props) {
  const [open, setOpen] = useState(false);

  const links: { id: NavTarget; label: string }[] = [
    { id: 'home', label: t.navHome },
    { id: 'about', label: t.navAbout },
    { id: 'episodes', label: t.navEpisodes },
    { id: 'interviews', label: t.navInterviews },
    { id: 'regions', label: t.navRegions },
    { id: 'contact', label: t.navContact },
  ];

  const go = (id: NavTarget) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-10 z-40 border-b border-moss/40 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => go('home')} className="flex shrink-0 items-center gap-3 text-left" aria-label="ISLAAH home">
          <img src="/images/islaah-wordmark.png" alt="Islaah" width={110} height={25} className="h-6 w-auto md:h-7" />
          <span className="hidden border-l border-moss pl-3 text-[11px] leading-tight text-gold xl:block">
            <span lang="ar" className="block font-serif text-sm">الإصلاح</span>
            Reform and reconciliation
          </span>
        </button>

        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium whitespace-nowrap text-mist lg:flex">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              aria-current={active === l.id ? 'page' : undefined}
              className={`border-b-2 pb-1 transition hover:text-gold ${
                active === l.id ? 'border-gold text-gold' : 'border-transparent'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div role="group" aria-label="Language" className="flex items-center rounded border border-moss bg-panel-2 px-2 py-1 text-xs">
            <Globe className="mr-1.5 h-3.5 w-3.5 text-gold" aria-hidden />
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                aria-pressed={lang === l}
                className={`rounded px-1.5 py-0.5 font-bold transition ${
                  lang === l ? 'bg-forest text-gold' : 'text-sage hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Menu"
            className="rounded p-1.5 text-paper hover:bg-forest lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="space-y-1 border-b border-moss bg-night px-6 py-3 lg:hidden">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              aria-current={active === l.id ? 'page' : undefined}
              className={`block w-full py-2 text-left font-medium hover:text-gold ${active === l.id ? 'text-gold' : 'text-paper'}`}
            >
              {l.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
