import { BookOpen, Radio, ShieldAlert } from 'lucide-react';
import type { Strings } from '../i18n';
import { SafeImage } from './SafeImage';

interface Props {
  t: Strings;
  onListen: () => void;
  onRead: () => void;
}

export function Hero({ t, onListen, onRead }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-moss/30 bg-ink">
      {/* Illustration sits on the right on wide screens and behind the text on phones. */}
      <SafeImage
        image="scene-recorder"
        priority
        className="absolute inset-0 md:left-[38%]"
        overlay="bg-gradient-to-r from-ink via-ink/70 to-ink/10 md:from-ink md:via-ink/40 md:to-transparent"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-transparent" />
      <div aria-hidden className="dot-grid absolute inset-0 opacity-[0.07]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8 lg:py-36">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-moss bg-forest/80 px-3 py-1 text-xs font-medium text-gold">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            {t.heroKicker}
          </p>

          <h1 className="mb-6 font-serif text-4xl leading-[1.08] font-extrabold tracking-tight text-snow sm:text-5xl lg:text-6xl">
            {t.heroTitle}
          </h1>

          <p className="mb-9 max-w-xl text-base leading-relaxed text-mist sm:text-lg">{t.heroSubtitle}</p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onListen}
              className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-sm font-bold text-ink shadow-lg transition hover:bg-gold-deep"
            >
              <Radio className="h-4 w-4" aria-hidden />
              {t.listenBtn}
            </button>
            <button
              onClick={onRead}
              className="flex items-center justify-center gap-2 rounded-lg border border-moss bg-forest px-7 py-3.5 text-sm font-semibold text-snow shadow transition hover:bg-moss"
            >
              <BookOpen className="h-4 w-4 text-gold" aria-hidden />
              {t.readBtn}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
