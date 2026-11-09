import type { KeyboardEvent, MouseEvent } from 'react';

interface Props {
  bars: number[];
  /** 0..1 */
  progress: number;
  onSeek?: (fraction: number) => void;
  label: string;
  className?: string;
}

/** Bar waveform. Bars before the playhead turn gold; click or arrow keys seek. */
export function Waveform({ bars, progress, onSeek, label, className = 'h-10' }: Props) {
  const played = Math.round(progress * bars.length);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const step = 1 / bars.length;
    if (e.key === 'ArrowRight') onSeek(Math.min(1, progress + step));
    if (e.key === 'ArrowLeft') onSeek(Math.max(0, progress - step));
  };

  return (
    <div
      role={onSeek ? 'slider' : 'img'}
      aria-label={label}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-valuenow={onSeek ? Math.round(progress * 100) : undefined}
      tabIndex={onSeek ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKey}
      className={`flex items-center gap-[3px] ${onSeek ? 'cursor-pointer' : ''} ${className}`}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          className={`flex-1 rounded-full transition-colors duration-300 ${i < played ? 'bg-gold' : 'bg-moss'}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
