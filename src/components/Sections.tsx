import { useEffect, useRef } from 'react';
import { CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { recruitmentLies } from '../data/episodes';
import type { Lang, Strings } from '../i18n';

export function RecruitmentLies({ t, lang }: { t: Strings; lang: Lang }) {
  return (
    <section id="recruitment" className="border-y border-moss/30 bg-panel/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-snow md:text-4xl">{t.liesHeading}</h2>
          <p className="mt-3 text-sm leading-relaxed text-sage md:text-base">{t.liesSub}</p>
        </div>
        {/* A sequence: the order recruits experience these lies. */}
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {recruitmentLies(lang).map((lie, i) => (
            <li key={lie.title} className="rounded-xl border border-moss bg-ink p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-forest font-serif font-bold text-gold">
                {i + 1}
              </span>
              <h3 className="mb-2 font-serif text-lg font-bold text-white">{lie.title}</h3>
              <p className="text-sm leading-relaxed text-mist">{lie.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Footer({ t }: { t: Strings }) {
  return (
    <footer className="border-t border-moss/50 bg-ink py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center gap-4">
          <img src="/images/islaah-wordmark.png" alt="Islaah" width={88} height={20} className="h-5 w-auto" loading="lazy" />
          <p className="text-xs text-sage">islaah.co.ke / {t.footerTag}</p>
        </div>
        <div className="space-y-1 text-center text-xs text-sage md:text-right">
          <p>{t.footerJournalist}</p>
          <p>{t.footerPrivacy}</p>
        </div>
      </div>
    </footer>
  );
}

export function PrivacyModal({ t, onClose }: { t: Strings; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg space-y-4 rounded-xl border border-moss bg-panel p-6 shadow-2xl md:p-8"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-sage hover:text-white">
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 text-gold">
          <ShieldAlert className="h-6 w-6" aria-hidden />
          <h2 id="privacy-title" className="font-serif text-xl font-bold text-white">
            {t.modalTitle}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-mist">{t.modalIntro}</p>
        <ul className="space-y-2.5 text-sm text-sage">
          {[t.modalPoint1, t.modalPoint2, t.modalPoint3].map((p) => (
            <li key={p} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
        <button
          ref={closeRef}
          onClick={onClose}
          className="w-full rounded border border-moss bg-forest py-2.5 text-sm font-bold text-gold hover:bg-moss"
        >
          {t.understood}
        </button>
      </div>
    </div>
  );
}
