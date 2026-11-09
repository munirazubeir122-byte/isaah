import { useEffect } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import type { Strings } from '../i18n';

/** Leave immediately and replace this page in the tab's history. */
export function quickExit() {
  try {
    sessionStorage.clear();
  } catch {
    /* storage may be blocked */
  }
  window.location.replace('https://www.google.com');
}

interface Props {
  t: Strings;
  onOpenPrivacy: () => void;
}

export function SafetyBar({ t, onOpenPrivacy }: Props) {
  // Esc anywhere leaves the site, unless a dialog is open (Esc closes it first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) quickExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside
      aria-label="Safety"
      className="sticky top-0 z-50 flex h-10 items-center justify-between border-b border-moss bg-forest px-4 text-xs shadow-md md:text-sm"
    >
      <div className="flex min-w-0 items-center gap-2 text-gold">
        <Lock className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden font-medium sm:inline">{t.privacyBadge}</span>
        <span className="font-medium sm:hidden">{t.privacyBadgeShort}</span>
        <button
          onClick={onOpenPrivacy}
          className="ml-1 truncate text-xs text-sage underline underline-offset-2 hover:text-snow"
        >
          {t.howWeProtect}
        </button>
      </div>
      <button
        onClick={quickExit}
        title={t.quickExitHint}
        aria-label={t.quickExitHint}
        className="flex shrink-0 items-center gap-1.5 rounded bg-exit px-3 py-1 text-xs font-bold text-white shadow-lg transition hover:bg-exit-deep active:scale-95"
      >
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        <span>{t.quickExit}</span>
        <kbd className="hidden rounded bg-white/15 px-1 font-sans text-[10px] font-semibold sm:inline">Esc</kbd>
      </button>
    </aside>
  );
}
