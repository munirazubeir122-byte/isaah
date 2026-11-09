import { useCallback, useEffect, useRef, useState } from 'react';
import type { Episode } from '../data/episodes';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioPlayer {
  currentId: string | null;
  status: PlayerStatus;
  isPlaying: boolean;
  /** Seconds elapsed in the current episode. */
  elapsed: number;
  toggle: (ep: Episode) => void;
  seek: (ep: Episode, fraction: number) => void;
  /** Stop and forget the current file (e.g. after a language switch). */
  stop: () => void;
}

/**
 * One shared <audio> element for the whole site, so only one testimony plays
 * at a time. Nothing downloads until the listener presses play.
 */
export function useAudioPlayer(): AudioPlayer {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Episode id + file. The same episode in another language is a new source.
  const loadedKey = useRef<string | null>(null);

  // Create the single audio element once.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.ontimeupdate = () => setElapsed(Math.floor(audio.currentTime));
    audio.onwaiting = () => setStatus('loading');
    audio.onplaying = () => setStatus('playing');
    audio.onpause = () => setStatus((s) => (s === 'error' ? s : 'paused'));
    audio.onended = () => {
      setStatus('paused');
      setElapsed(0);
      audio.currentTime = 0;
    };
    audio.onerror = () => setStatus('error');
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  /** Point the shared element at an episode's file, if it isn't already. */
  const select = useCallback((ep: Episode) => {
    const audio = audioRef.current;
    const key = `${ep.id}|${ep.audioSrc ?? ''}`;
    if (!audio || loadedKey.current === key) return audio;
    audio.pause();
    if (ep.audioSrc) audio.src = ep.audioSrc;
    else audio.removeAttribute('src');
    loadedKey.current = key;
    setCurrentId(ep.id);
    setElapsed(0);
    setStatus('idle');
    return audio;
  }, []);

  const toggle = useCallback(
    (ep: Episode) => {
      const wasLoaded = loadedKey.current === `${ep.id}|${ep.audioSrc ?? ''}`;
      const audio = select(ep);
      if (!audio) return;
      if (!ep.audioSrc) {
        setStatus('error');
        return;
      }
      if (wasLoaded && !audio.paused) {
        audio.pause();
        return;
      }
      setStatus('loading');
      audio.play().catch(() => setStatus('error'));
    },
    [select],
  );

  const seek = useCallback(
    (ep: Episode, fraction: number) => {
      const audio = select(ep);
      if (!audio || !ep.audioSrc) return;
      const target = fraction * ep.durationSec;
      setElapsed(Math.floor(target));
      if (audio.readyState >= 1) {
        audio.currentTime = target;
      } else {
        // Metadata not loaded yet: fetch it, then jump.
        audio.preload = 'metadata';
        audio.addEventListener('loadedmetadata', () => (audio.currentTime = target), { once: true });
        audio.load();
      }
    },
    [select],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    loadedKey.current = null;
    setCurrentId(null);
    setElapsed(0);
    setStatus('idle');
  }, []);

  return { currentId, status, isPlaying: status === 'playing' || status === 'loading', elapsed, toggle, seek, stop };
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
