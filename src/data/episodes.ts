import type { ImageKey } from './images';
import type { Lang, Strings } from '../i18n';
import { STORIES, type Story } from './stories';
import { STORIES_SO } from './stories.so';
import { AUDIO } from './audio-manifest';

export type RegionId = 'Mozambique' | 'Kenya & Somalia' | 'DRC' | 'Tanzania';

export const REGIONS: { id: RegionId; labelKey: keyof Strings }[] = [
  { id: 'Mozambique', labelKey: 'regionMozambique' },
  { id: 'Kenya & Somalia', labelKey: 'regionKenya' },
  { id: 'DRC', labelKey: 'regionDRC' },
  { id: 'Tanzania', labelKey: 'regionTanzania' },
];

export interface Episode extends Story {
  region: RegionId;
  subRegion: string;
  date: string;
  image: ImageKey;
  /** Language the story text is in (falls back to EN). */
  textLang: Lang;
  /** Language the audio is in (falls back to EN). */
  audioLang: Lang;
  /** Path to the narration, if one has been generated. */
  audioSrc?: string;
  /** Real length of the audio in seconds (0 when there is no audio yet). */
  durationSec: number;
  /** Relative bar heights (0-100) for the waveform display. */
  wave: number[];
}

/** Everything about an episode except its text, keyed by id. */
const META: Record<string, Pick<Episode, 'region' | 'subRegion' | 'date' | 'image'>> = {
  'ep-01': { region: 'Mozambique', subRegion: 'Cabo Delgado', date: 'October 2025', image: 'story-coast' },
  'ep-02': { region: 'Kenya & Somalia', subRegion: 'Nairobi / Lower Shabelle', date: 'November 2025', image: 'story-road' },
  'ep-03': { region: 'DRC', subRegion: 'Beni forests', date: 'December 2025', image: 'story-forest' },
  'ep-04': { region: 'Tanzania', subRegion: 'Tanga / Pangani', date: 'January 2026', image: 'story-mangroves' },
};

/** Translated story text. Languages missing here show English. */
const TEXT: Partial<Record<Lang, Story[]>> = { EN: STORIES, SO: STORIES_SO };

/** Placeholder bars, used only until the audio script has measured the file. */
const FLAT_WAVE = Array.from({ length: 48 }, (_, i) => 35 + ((i * 37) % 50));

export function getEpisodes(lang: Lang): Episode[] {
  return STORIES.map((base) => {
    const textLang: Lang = TEXT[lang]?.some((s) => s.id === base.id) ? lang : 'EN';
    const story = TEXT[textLang]!.find((s) => s.id === base.id)!;
    const audioLang: Lang = AUDIO[lang]?.[base.id] ? lang : 'EN';
    const audio = AUDIO[audioLang]?.[base.id];
    return {
      ...story,
      ...META[base.id],
      textLang,
      audioLang,
      audioSrc: audio?.src,
      durationSec: audio?.seconds ?? 0,
      wave: audio?.wave ?? FLAT_WAVE,
    };
  });
}

export function minutes(ep: Episode): number {
  return Math.max(1, Math.round(ep.durationSec / 60));
}

/** One-line context for each region on the Regions section. */
const REGION_INFO: Partial<Record<Lang, Record<RegionId, string>>> = {
  EN: {
    Mozambique: 'Cabo Delgado, where an insurgency since 2017 has drawn in young men from across the coast.',
    'Kenya & Somalia': 'From Nairobi and the coast to southern Somalia, where al-Shabaab recruits across the border.',
    DRC: 'North Kivu and the Beni forests, where the ADF abducts as often as it recruits.',
    Tanzania: 'The Tanga coast, a route for young recruits heading south toward Mozambique.',
  },
  SO: {
    Mozambique: 'Cabo Delgado, halkaas oo kacdoon ka socda tan iyo 2017 uu soo jiitay dhallinyaro ka kala yimid xeebta oo dhan.',
    'Kenya & Somalia': 'Laga bilaabo Nairobi iyo xeebta ilaa koonfurta Soomaaliya, halkaas oo al-Shabaab ay ka qorto xuduudka dhinaciisa kale.',
    DRC: 'Waqooyiga Kivu iyo kaymaha Beni, halkaas oo ADF ay afduubto inta ay qorto oo kale.',
    Tanzania: 'Xeebta Tanga, waddo ay maraan dhallinyarada la qoray ee u socda koonfurta xagga Mozambique.',
  },
};

export function regionInfo(lang: Lang, id: RegionId): string {
  return (REGION_INFO[lang] ?? REGION_INFO.EN!)[id];
}

type Lie = { title: string; body: string };

const LIES: Partial<Record<Lang, Lie[]>> = {
  EN: [
    {
      title: 'The false promise of wealth',
      body: 'Unemployed youth in coastal towns and cities are offered loans, business capital, or monthly stipends that disappear the moment they reach the camps.',
    },
    {
      title: 'The distortion of duty',
      body: 'Religious grievances and local political marginalization are weaponized through distorted theology, convincing recruits they are fighting for justice.',
    },
    {
      title: 'The trap of total isolation',
      body: 'On arrival at remote bases, phones are confiscated, contact with family is cut, and fear of execution keeps people bound to the group.',
    },
  ],
  SO: [
    {
      title: 'Ballanta beenta ah ee hantida',
      body: 'Dhallinyarada aan shaqada lahayn ee magaalooyinka xeebta iyo magaalooyinka waaweyn waxaa loo bandhigaa deyn, raasumaal ganacsi, ama mushahar bille ah oo baaba’a isla markay gaadhaan xeryaha.',
    },
    {
      title: 'Qalloocinta waajibka',
      body: 'Cabashooyinka diineed iyo takoorka siyaasadeed ee maxalliga ah waxaa loo adeegsadaa diin la qalloociyay, si loogu qanciyo kuwa la qorayo inay u dagaallamayaan cadaalad.',
    },
    {
      title: 'Dabinka go’doominta buuxda',
      body: 'Markay gaadhaan saldhigyada fogfog, taleefannada waa laga qaataa, xidhiidhka qoyska waa la jaraa, cabsida dilkuna waxay dadka ku xidhaa kooxda.',
    },
  ],
};

export function recruitmentLies(lang: Lang): Lie[] {
  return LIES[lang] ?? LIES.EN!;
}
