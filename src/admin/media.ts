// Prepares uploads in the browser before they leave the computer.
import { api } from './api';

/**
 * Re-draws a picture on a canvas and saves it as WebP. Besides resizing, this
 * drops everything hidden in the original file (camera model, GPS location,
 * date), which matters for source protection.
 */
async function toWebp(file: File, maxWidth: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const w = Math.min(maxWidth, bitmap.width);
  const h = Math.round((bitmap.height * w) / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
  if (!blob) throw new Error('This browser could not convert the image. Try Chrome or Edge.');
  return blob;
}

/** Uploads a large and a phone-sized copy of an image. */
export async function uploadImage(file: File): Promise<{ sm: string; lg: string }> {
  const lgBlob = await toWebp(file, 1400, 0.8);
  const lg = await api<{ src: string; base: string }>('admin/media?kind=image&ext=webp&suffix=lg', { raw: lgBlob });
  const smBlob = await toWebp(file, 720, 0.7);
  const sm = await api<{ src: string }>(`admin/media?kind=image&ext=webp&suffix=sm&base=${lg.base}`, { raw: smBlob });
  return { sm: sm.src, lg: lg.src };
}

/** Measures an audio file: its length and 48 bars for the waveform. */
async function analyzeAudio(file: File): Promise<{ seconds: number; wave: number[] }> {
  const ctx = new AudioContext();
  try {
    const audio = await ctx.decodeAudioData(await file.arrayBuffer());
    const data = audio.getChannelData(0);
    const bars = 48;
    const step = Math.max(1, Math.floor(data.length / bars));
    const rms: number[] = [];
    for (let b = 0; b < bars; b++) {
      let sum = 0;
      for (let i = b * step; i < Math.min(data.length, (b + 1) * step); i += 16) sum += data[i] * data[i];
      rms.push(Math.sqrt(sum / (step / 16)));
    }
    const max = Math.max(...rms) || 1;
    return { seconds: Math.round(audio.duration), wave: rms.map((v) => Math.max(15, Math.round((v / max) * 100))) };
  } finally {
    void ctx.close();
  }
}

export async function uploadAudio(file: File): Promise<{ src: string; seconds: number; wave: number[] }> {
  const ext = file.name.toLowerCase().match(/\.(mp3|m4a|ogg)$/)?.[1];
  if (!ext) throw new Error('Choose an MP3, M4A or OGG file.');
  const measured = await analyzeAudio(file);
  const up = await api<{ src: string }>(`admin/media?kind=audio&ext=${ext}`, { raw: file });
  return { src: up.src, ...measured };
}
