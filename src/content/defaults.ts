// The content that ships with the site. Used until something is edited in
// the dashboard, as the starting point when the database is first filled,
// and as a fallback if the server cannot be reached.
import { STORIES, type Story } from '../data/stories';
import { STORIES_SO } from '../data/stories.so';
import { AUDIO } from '../data/audio-manifest';
import type { Lang } from '../i18n';
import type { EpisodeRecord, EpisodeText } from './types';

const META: Record<string, Pick<EpisodeRecord, 'region' | 'subRegion' | 'date' | 'image'>> = {
  'ep-01': { region: 'Mozambique', subRegion: 'Cabo Delgado', date: 'October 2025', image: 'story-coast' },
  'ep-02': { region: 'Kenya & Somalia', subRegion: 'Nairobi / Lower Shabelle', date: 'November 2025', image: 'story-road' },
  'ep-03': { region: 'DRC', subRegion: 'Beni forests', date: 'December 2025', image: 'story-forest' },
  'ep-04': { region: 'Tanzania', subRegion: 'Tanga / Pangani', date: 'January 2026', image: 'story-mangroves' },
};

const TEXT: Partial<Record<Lang, Story[]>> = { EN: STORIES, SO: STORIES_SO };

const toText = (s: Story): EpisodeText => ({ title: s.title, hook: s.hook, acts: s.acts });

export function defaultEpisodes(): EpisodeRecord[] {
  return STORIES.map((base, i) => {
    const text: EpisodeRecord['text'] = {};
    const audio: EpisodeRecord['audio'] = {};
    for (const [lang, list] of Object.entries(TEXT) as [Lang, Story[]][]) {
      const s = list.find((x) => x.id === base.id);
      if (s) text[lang] = toText(s);
    }
    for (const [lang, byId] of Object.entries(AUDIO) as [Lang, (typeof AUDIO)[string]][]) {
      const a = byId[base.id];
      if (a) audio[lang] = { src: a.src, seconds: a.seconds, wave: a.wave };
    }
    return {
      id: base.id,
      sort: i + 1,
      published: true,
      sample: base.sample,
      ...META[base.id],
      text,
      audio,
    };
  });
}
