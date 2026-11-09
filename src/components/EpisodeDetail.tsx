import { AlertCircle, ArrowLeft, Info, Loader2, Lock, Pause, Play, ShieldAlert } from 'lucide-react';
import { minutes, REGIONS, type Episode } from '../data/episodes';
import { formatTime, type AudioPlayer } from '../hooks/useAudioPlayer';
import { HTML_LANG, type Lang, type Strings } from '../i18n';
import { SafeImage } from './SafeImage';
import { Waveform } from './Waveform';

interface Props {
  ep: Episode;
  t: Strings;
  lang: Lang;
  player: AudioPlayer;
  onBack: () => void;
}

export function EpisodeDetail({ ep, t, lang, player, onBack }: Props) {
  const textLang = HTML_LANG[ep.textLang];
  const total = ep.durationSec;
  const isCurrent = player.currentId === ep.id;
  const playing = isCurrent && player.isPlaying;
  const status = isCurrent ? player.status : 'idle';
  const elapsed = isCurrent ? player.elapsed : 0;
  const statusText = {
    idle: t.ready,
    loading: t.loading,
    playing: t.playing,
    paused: t.paused,
    error: t.audioError,
  }[status];
  const region = t[REGIONS.find((r) => r.id === ep.region)!.labelKey];

  // The four-part arc every testimony follows. Gold marks the turning points.
  const acts = [
    { n: 'I', title: t.act1, sub: t.act1Sub, body: ep.acts.promise, accent: 'border-gold', label: 'text-gold' },
    { n: 'II', title: t.act2, sub: t.act2Sub, body: ep.acts.reality, accent: 'border-forest', label: 'text-sage' },
    { n: 'III', title: t.act3, sub: t.act3Sub, body: ep.acts.breakingPoint, accent: 'border-gold', label: 'text-gold' },
    { n: 'IV', title: t.act4, sub: t.act4Sub, body: ep.acts.return, accent: 'border-moss', label: 'text-sage' },
  ];

  return (
    <article className="mx-auto max-w-4xl space-y-8 px-4 py-10 md:py-12">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gold hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </button>

      {ep.sample && (
        <p className="flex items-start gap-2.5 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-paper">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
          {t.sampleNotice}
        </p>
      )}
      {ep.textLang !== 'EN' && (
        <p className="flex items-start gap-2.5 rounded-lg border border-moss bg-panel px-4 py-3 text-sm text-mist">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sage" aria-hidden />
          {t.translationDraft}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-moss bg-panel shadow-2xl">
        <SafeImage image={ep.image} priority className="h-56 md:h-80" />

        <div className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded border border-moss bg-ink px-3 py-1 text-xs font-bold text-gold">
              {region} / {ep.subRegion}
            </span>
            <span className="text-xs whitespace-nowrap text-sage">
              {minutes(ep)} min
              {ep.audioLang !== lang && <span className="ml-2 rounded bg-ink px-1.5 py-0.5">{t.audioInEnglish}</span>}
            </span>
          </div>

          <h1 lang={textLang} className="mb-4 font-serif text-3xl leading-tight font-bold text-snow md:text-[2.6rem]">{ep.title}</h1>

          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-moss/50 pb-6 text-xs text-sage">
            <span>
              {t.published}: {ep.date}
            </span>
            <span className="flex items-center gap-1 text-gold">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
              {t.voiceShifted}
            </span>
          </div>

          {/* Waveform audio player */}
          <div className="flex flex-col items-center gap-4 rounded-lg border border-moss bg-ink p-4 sm:flex-row">
            <button
              onClick={() => player.toggle(ep)}
              aria-label={playing ? t.pause : t.play}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold bg-forest text-gold shadow-lg transition hover:bg-moss"
            >
              {status === 'loading' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : playing ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="ml-0.5 h-6 w-6" />
              )}
            </button>
            <div className="w-full flex-1 space-y-2">
              <div className="flex justify-between gap-3 text-xs text-sage" aria-live="polite">
                <span className={`flex items-center gap-1.5 ${status === 'error' ? 'text-exit' : ''}`}>
                  {status === 'error' && <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  {statusText}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatTime(elapsed)} / {formatTime(total)}
                </span>
              </div>
              <Waveform
                bars={ep.wave}
                progress={total ? elapsed / total : 0}
                onSeek={(f) => player.seek(ep, f)}
                label={`${ep.title}: ${formatTime(elapsed)} / ${formatTime(total)}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hook */}
      <blockquote lang={textLang} className="px-2 font-serif text-xl leading-relaxed text-paper italic md:px-6 md:text-2xl">
        “{ep.hook}”
      </blockquote>

      {/* Narrative arc */}
      <ol className="space-y-6">
        {acts.map((a) => (
          <li key={a.n} className={`rounded-r-lg border-l-4 bg-panel/60 p-6 md:p-7 ${a.accent}`}>
            <p className={`mb-1 text-xs font-bold ${a.label}`}>
              Act {a.n} · {a.sub}
            </p>
            <h2 className="mb-4 font-serif text-2xl font-semibold text-white">{a.title}</h2>
            <div lang={textLang} className="max-w-[68ch] space-y-4 font-serif text-[17px] leading-[1.75] text-mist">
              {a.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <p className="flex items-center gap-3 rounded-lg border border-moss bg-ink p-4 text-xs text-sage">
        <Lock className="h-5 w-5 shrink-0 text-gold" aria-hidden />
        {t.securityNote}
      </p>
    </article>
  );
}
