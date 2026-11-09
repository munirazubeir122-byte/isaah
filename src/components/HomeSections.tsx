import { ArrowRight, BookOpen, MapPin, MessageCircle } from 'lucide-react';
import { REGIONS, regionInfo, type Episode, type RegionId } from '../data/episodes';
import { aboutContent } from '../data/pages';
import { HTML_LANG, type Lang, type Strings } from '../i18n';
import { SafeImage } from './SafeImage';

/** Written testimonies: a reading list, separate from the audio cards. */
export function Interviews({
  t,
  episodes,
  regionLabel,
  onOpen,
}: {
  t: Strings;
  episodes: Episode[];
  regionLabel: (id: RegionId) => string;
  onOpen: (ep: Episode) => void;
}) {
  return (
    <section id="interviews" className="border-t border-moss/30 bg-panel/40 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl font-bold text-snow md:text-4xl">{t.interviewsHeading}</h2>
        <p className="mt-3 mb-10 max-w-2xl text-sm leading-relaxed text-sage md:text-base">{t.interviewsSub}</p>

        <ul className="divide-y divide-moss/40 border-y border-moss/40">
          {episodes.map((ep) => (
            <li key={ep.id}>
              <button
                onClick={() => onOpen(ep)}
                className="group grid w-full gap-2 py-6 text-left md:grid-cols-[12rem_1fr_auto] md:items-baseline md:gap-8"
              >
                <span className="text-xs font-semibold text-gold">
                  {regionLabel(ep.region)} <span className="text-sage">/ {ep.subRegion}</span>
                </span>
                <span lang={HTML_LANG[ep.textLang]}>
                  <span className="block font-serif text-xl font-bold text-white transition group-hover:text-gold">
                    {ep.title}
                  </span>
                  <span className="mt-2 line-clamp-2 block font-serif text-[15px] leading-relaxed text-mist italic">
                    “{ep.hook}”
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-sage group-hover:text-gold">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  {t.readInterview}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** One card per region; choosing one filters the episode list. */
export function Regions({
  t,
  lang,
  episodes,
  onChoose,
}: {
  t: Strings;
  lang: Lang;
  episodes: Episode[];
  onChoose: (id: RegionId) => void;
}) {
  return (
    <section id="regions" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <h2 className="font-serif text-3xl font-bold text-snow md:text-4xl">{t.regionsHeading}</h2>
      <p className="mt-3 mb-10 max-w-2xl text-sm leading-relaxed text-sage md:text-base">{t.regionsSub}</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REGIONS.map((r) => {
          const n = episodes.filter((e) => e.region === r.id).length;
          return (
            <button
              key={r.id}
              onClick={() => onChoose(r.id)}
              className="group flex flex-col rounded-xl border border-moss/60 bg-panel p-6 text-left transition hover:border-gold"
            >
              <MapPin className="mb-4 h-5 w-5 text-gold" aria-hidden />
              <span className="font-serif text-xl font-bold text-white">{t[r.labelKey]}</span>
              <span className="mt-1 text-xs text-sage">
                {n === 1 ? t.episodeCountOne : t.episodeCount.replace('{n}', String(n))}
              </span>
              <span className="mt-4 mb-6 text-sm leading-relaxed text-mist">{regionInfo(lang, r.id)}</span>
              <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-gold">
                {t.listenRegion}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Invitation to contribute, shown at the foot of the home and About pages. */
export function ShareStoryBand({ lang, onContact }: { lang: Lang; onContact: () => void }) {
  const a = aboutContent(lang);
  return (
    <section className="relative overflow-hidden border-y border-moss/40 bg-ink">
      <SafeImage image="scene-homeward" className="absolute inset-0" overlay="bg-gradient-to-r from-ink via-ink/85 to-ink/50" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="max-w-xl">
          <h2 className="font-serif text-3xl font-bold text-snow md:text-4xl">{a.ctaTitle}</h2>
          <p className="mt-4 mb-8 font-serif text-lg leading-relaxed text-mist">{a.ctaBody}</p>
          <button
            onClick={onContact}
            className="flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-sm font-bold text-ink shadow-lg transition hover:bg-gold-deep"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {a.ctaButton}
          </button>
        </div>
      </div>
    </section>
  );
}
