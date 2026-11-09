// Narrates every story with Microsoft's neural voices.
//
//   English (Kenya): Asilia hosts (act titles, closing line),
//                    Chilemba reads the testimony.
//   Somali:          Ubax hosts, Muuse reads the testimony.
//
// The testimony is re-voiced by a synthetic narrator, so no source's real
// voice is ever published.
//
// Two ways to reach the voices:
//
//   Azure (official, use this for the published site)
//     Put your key and region in .env.local:
//       AZURE_SPEECH_KEY=xxxxxxxx
//       AZURE_SPEECH_REGION=southafricanorth
//     then:  npm.cmd run audio
//
//   Edge read-aloud (preview only, no account)
//     npm.cmd run audio:edge
//     Same voices, but it is not an approved use of that service and can
//     stop working without notice. Re-run with Azure before publishing.
//
// Pick languages / episodes:  npm.cmd run audio -- SO ep-02
//
// To keep a real recording instead, save it as public/audio/<lang>/<id>.mp3
// and add "<LANG>:<id>" to KEEP so it is never overwritten.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';

const KEEP = new Set([]); // e.g. new Set(['EN:ep-01'])

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const MANIFEST = path.join(root, 'src', 'data', 'audio-manifest.ts');
const RATE = 24000; // every segment is normalised to 24 kHz mono
const BARS = 48;
const KBPS = 48;

const args = process.argv.slice(2);
const useEdge = args.includes('--edge');

// ---------------------------------------------------------------- providers

async function azureProvider() {
  try {
    process.loadEnvFile(path.join(root, '.env.local'));
  } catch {
    /* handled below */
  }
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  if (!key || !region || key.startsWith('paste')) {
    console.error(
      '\nMissing Azure Speech key.\n' +
        'Open "islaah website\\.env.local" and fill in AZURE_SPEECH_KEY and AZURE_SPEECH_REGION,\n' +
        'then run this again. For a quick preview without an account: npm.cmd run audio:edge\n',
    );
    process.exit(1);
  }
  return {
    name: 'azure',
    async speak(locale, voice, inner, rate) {
      const xml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
        `<voice name="${voice}"><prosody rate="${rate}">${inner}</prosody></voice></speak>`;
      const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'raw-24khz-16bit-mono-pcm',
          'User-Agent': 'islaah-audio',
        },
        body: xml,
      });
      if (res.status === 401) throw new Error('Azure rejected the key (401). Check AZURE_SPEECH_KEY and that AZURE_SPEECH_REGION matches it.');
      if (!res.ok) throw new Error(`Azure error ${res.status}: ${await res.text()}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1).slice();
    },
    close() {},
  };
}

async function edgeProvider() {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const { MPEGDecoder } = await import('mpg123-decoder');
  const decoder = new MPEGDecoder();
  await decoder.ready;
  let tts = null;
  let currentVoice = null;

  // When the service drops a connection, the library throws from inside a
  // socket callback where no try/catch can reach it. Route that error to the
  // request that is waiting, so it can be retried instead of crashing.
  let failCurrent = null;
  process.on('uncaughtException', (err) => {
    if (failCurrent && /Stream closed|WebSocket|ECONNRESET/i.test(err.message)) failCurrent(err);
    else {
      console.error(err);
      process.exit(1);
    }
  });

  const once = async (voice, inner, rate) => {
    if (!tts || currentVoice !== voice) {
      tts?.close();
      tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      currentVoice = voice;
    }
    const { audioStream } = tts.toStream(inner, { rate });
    const chunks = [];
    await new Promise((resolve, reject) => {
      failCurrent = reject;
      audioStream.on('data', (c) => chunks.push(c));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    }).finally(() => (failCurrent = null));
    const mp3 = Buffer.concat(chunks);
    if (!mp3.length) throw new Error('Edge returned no audio');
    await decoder.reset();
    const { channelData, sampleRate } = decoder.decode(new Uint8Array(mp3));
    if (sampleRate !== RATE) throw new Error(`Unexpected sample rate ${sampleRate}`);
    const f = channelData[0];
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(f[i] * 32767)));
    return out;
  };

  return {
    name: 'edge',
    async speak(_locale, voice, inner, rate) {
      // The service drops connections now and then; retry with a fresh one.
      for (let attempt = 1; ; attempt++) {
        try {
          return await once(voice, inner, rate);
        } catch (err) {
          tts?.close();
          tts = null;
          if (attempt >= 4) throw err;
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
    },
    close() {
      tts?.close();
      decoder.free();
    },
  };
}

// ---------------------------------------------------------------- scripts

const load = async (file, name) => (await import(pathToFileURL(path.join(root, 'src', 'data', file)).href))[name];


const LANGS = {
  EN: {
    locale: 'en-KE',
    host: 'en-KE-AsiliaNeural',
    narrator: 'en-KE-ChilembaNeural',
    stories: () => load('stories.ts', 'STORIES'),
    acts: ['Act one. The Promise.', 'Act two. The Reality.', 'Act three. The Breaking Point.', 'Act four. The Return.'],
    closing: 'If you or someone you know is being pressured to join an armed group, speak to someone you trust.',
  },
  SO: {
    locale: 'so-SO',
    host: 'so-SO-UbaxNeural',
    narrator: 'so-SO-MuuseNeural',
    stories: () => load('stories.so.ts', 'STORIES_SO'),
    acts: ['Qaybta koowaad. Ballanta.', 'Qaybta labaad. Xaqiiqada.', 'Qaybta saddexaad. Barta Jabka.', 'Qaybta afraad. Soo Noqoshada.'],
    closing: 'Haddii adiga ama qof aad taqaanid lagu cadaadinayo inuu ku biiro koox hubeysan, la hadal qof aad ku kalsoon tahay.',
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The episode as a list of spoken lines, each followed by a pause. Every line
 * is a separate request (the Edge service rejects <break> markup), and the
 * pauses are inserted here as silence.
 */
// The episode opens straight on the story: no station name, episode number or
// voice disclaimer is spoken. The episode page states in writing that the
// testimony is re-voiced (and, for sample stories, that it is illustrative).
function turns(cfg, story) {
  const host = (text, pauseMs) => ({ voice: cfg.host, inner: esc(text), rate: '-4%', pauseMs });
  const narrator = (text, pauseMs) => ({ voice: cfg.narrator, inner: esc(text), rate: '-8%', pauseMs });
  const out = [narrator(story.hook, 1500)];
  ['promise', 'reality', 'breakingPoint', 'return'].forEach((k, i) => {
    out.push(host(cfg.acts[i], 800));
    story.acts[k].forEach((p, j, all) => out.push(narrator(p, j === all.length - 1 ? 1300 : 750)));
  });
  out.push(host(cfg.closing, 500));
  return out;
}

// ---------------------------------------------------------------- audio

function concat(parts) {
  const total = parts.reduce((n, p) => n + p.samples.length + Math.round((p.pauseMs / 1000) * RATE), 0);
  const out = new Int16Array(total); // zero-filled, so the pauses are silence
  let off = 0;
  for (const p of parts) {
    out.set(p.samples, off);
    off += p.samples.length + Math.round((p.pauseMs / 1000) * RATE);
  }
  return out;
}

function waveform(samples) {
  const per = Math.floor(samples.length / BARS);
  const rms = Array.from({ length: BARS }, (_, b) => {
    let sum = 0;
    for (let i = b * per; i < (b + 1) * per; i++) sum += samples[i] * samples[i];
    return Math.sqrt(sum / per);
  });
  const min = Math.min(...rms);
  const span = Math.max(...rms) - min || 1;
  return rms.map((v) => Math.round(15 + ((v - min) / span) * 85));
}

function encodeMp3(samples) {
  const enc = new Mp3Encoder(1, RATE, KBPS);
  const chunks = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const out = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (out.length) chunks.push(Buffer.from(out));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

// ---------------------------------------------------------------- run

const langs = args.filter((a) => a.toUpperCase() in LANGS).map((a) => a.toUpperCase());
const only = new Set(args.filter((a) => a.startsWith('ep-')));
const runLangs = langs.length ? langs : Object.keys(LANGS);
const provider = useEdge ? await edgeProvider() : await azureProvider();
console.log(`Voices via ${provider.name === 'edge' ? 'Edge read-aloud (preview only)' : 'Azure Speech'}\n`);

let manifest = {};
try {
  manifest = structuredClone((await import(pathToFileURL(MANIFEST).href + `?t=${Date.now()}`)).AUDIO);
} catch {
  /* first run */
}

const saveManifest = () => {
  const body = Object.entries(manifest)
    .map(
      ([lang, eps]) =>
        `  ${JSON.stringify(lang)}: {\n` +
        Object.entries(eps)
          .map(([id, a]) => `    ${JSON.stringify(id)}: ${JSON.stringify(a)},\n`)
          .join('') +
        `  },\n`,
    )
    .join('');
  return writeFile(
    MANIFEST,
    `// Generated by scripts/generate-audio.mjs. Do not edit by hand.\n` +
      `export type AudioEntry = { src: string; seconds: number; wave: number[]; voice: string };\n` +
      `export const AUDIO: Record<string, Record<string, AudioEntry>> = {\n${body}};\n`,
  );
};

try {
  for (const lang of runLangs) {
    const cfg = LANGS[lang];
    const stories = await cfg.stories();
    const outDir = path.join(root, 'public', 'audio', lang.toLowerCase());
    await mkdir(outDir, { recursive: true });
    manifest[lang] ??= {};

    for (const story of stories) {
      if (only.size && !only.has(story.id)) continue;
      if (KEEP.has(`${lang}:${story.id}`)) {
        console.log(`${lang} ${story.id}: kept (real recording)`);
        continue;
      }
      process.stdout.write(`${lang} ${story.id}: narrating `);
      const parts = [];
      for (const turn of turns(cfg, story)) {
        const samples = await provider.speak(cfg.locale, turn.voice, turn.inner, turn.rate);
        parts.push({ samples, pauseMs: turn.pauseMs });
        process.stdout.write('.');
      }
      const samples = concat(parts);
      const mp3 = encodeMp3(samples);
      await writeFile(path.join(outDir, `${story.id}.mp3`), mp3);
      const seconds = Math.round(samples.length / RATE);
      manifest[lang][story.id] = {
        src: `/audio/${lang.toLowerCase()}/${story.id}.mp3`,
        seconds,
        wave: waveform(samples),
        voice: `${provider.name}:${cfg.host}+${cfg.narrator}`,
      };
      // Save after every episode so an interrupted run keeps its progress.
      await saveManifest();
      console.log(` ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}  ${(mp3.length / 1024).toFixed(0)} KB`);
    }
  }
} finally {
  provider.close();
}
console.log('\nUpdated', path.relative(root, MANIFEST));
