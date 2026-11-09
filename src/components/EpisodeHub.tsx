import { Lock } from 'lucide-react';
import { REGIONS, type Episode, type RegionId } from '../data/episodes';
import type { AudioPlayer } from '../hooks/useAudioPlayer';
import type { Lang, Strings } from '../i18n';
import { EpisodeCard } from './EpisodeCard';

interface Props {
  t: Strings;
  lang: Lang;
  episodes: Episode[];
  filter: RegionId | 'ALL';
  onFilter: (r: RegionId | 'ALL') => void;
  player: AudioPlayer;
  onOpen: (ep: Episode) => void;
}

export function EpisodeHub({ t, lang, episodes, filter, onFilter, player, onOpen }: Props) {
  const options = [{ id: 'ALL' as const, label: t.regionAll }, ...REGIONS.map((r) => ({ id: r.id, label: t[r.labelKey] }))];
  const regionLabel = (id: RegionId) => t[REGIONS.find((r) => r.id === id)!.labelKey];
  const shown = episodes.filter((ep) => filter === 'ALL' || ep.region === filter);

  return (
    <>
      {/* Region filter bar */}
      <section
        aria-label={t.filterLabel}
        className="sticky top-[104px] z-30 border-b border-moss/30 bg-night/95 backdrop-blur"
      >
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3.5 sm:px-6 lg:px-8">
          <span className="mr-2 shrink-0 text-xs font-bold text-sage">{t.filterLabel}</span>
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => onFilter(o.id)}
              aria-pressed={filter === o.id}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                filter === o.id
                  ? 'border-moss bg-forest text-gold'
                  : 'border-transparent bg-panel text-sage hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Episode grid */}
      <section id="episodes" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="font-serif text-3xl font-bold text-snow md:text-4xl">{t.episodesHeading}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sage md:text-base">{t.episodesSub}</p>
          </div>
          <p className="flex shrink-0 items-center gap-1.5 text-xs text-gold">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {t.archiveBadge}
          </p>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl border border-moss/60 bg-panel p-8 text-center text-sm text-mist">{t.noEpisodes}</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {shown.map((ep) => (
              <EpisodeCard
                key={ep.id}
                ep={ep}
                t={t}
                lang={lang}
                regionLabel={regionLabel(ep.region)}
                player={player}
                onOpen={() => onOpen(ep)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
