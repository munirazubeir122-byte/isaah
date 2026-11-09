import { ChevronRight, Clock, Pause, Play } from 'lucide-react';
import { minutes, type Episode } from '../data/episodes';
import type { AudioPlayer } from '../hooks/useAudioPlayer';
import { HTML_LANG, type Lang, type Strings } from '../i18n';
import { SafeImage } from './SafeImage';
import { Waveform } from './Waveform';

interface Props {
  ep: Episode;
  t: Strings;
  lang: Lang;
  regionLabel: string;
  player: AudioPlayer;
  onOpen: () => void;
}

export function EpisodeCard({ ep, t, lang, regionLabel, player, onOpen }: Props) {
  const isCurrent = player.currentId === ep.id;
  const playing = isCurrent && player.isPlaying;
  const progress = isCurrent && ep.durationSec ? player.elapsed / ep.durationSec : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-moss/60 bg-panel shadow-xl transition duration-300 hover:border-gold">
      <button onClick={onOpen} className="block text-left" tabIndex={-1} aria-hidden>
        <SafeImage image={ep.image} className="h-48 sm:h-56" />
      </button>

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-gold">
            {regionLabel} <span className="text-sage">/ {ep.subRegion}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sage">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {minutes(ep)} min
            {ep.audioLang !== lang && <span className="ml-1 rounded bg-ink px-1.5 py-0.5">{t.audioInEnglish}</span>}
          </span>
        </div>

        <h3 lang={HTML_LANG[ep.textLang]} className="mb-4 font-serif text-xl leading-snug font-bold text-white">
          <button onClick={onOpen} className="text-left transition group-hover:text-gold">
            {ep.title}
          </button>
        </h3>

        <blockquote lang={HTML_LANG[ep.textLang]} className="mb-6 rounded border-l-2 border-gold bg-ink/50 p-4 font-serif text-[15px] leading-relaxed text-mist italic">
          “{ep.hook}”
        </blockquote>

        <div className="mt-auto flex items-center gap-4 border-t border-moss/40 pt-4">
          <button
            onClick={() => player.toggle(ep)}
            aria-label={`${playing ? t.pause : t.play}: ${ep.title}`}
            className="flex shrink-0 items-center gap-2 text-xs font-bold text-gold transition hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold bg-forest">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </span>
            <span className="hidden sm:inline">{playing ? t.pause : t.play}</span>
          </button>

          <Waveform bars={ep.wave} progress={progress} label="" className="h-6 flex-1 opacity-80" />

          <button
            onClick={onOpen}
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-sage hover:text-gold"
          >
            {t.readStory}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
