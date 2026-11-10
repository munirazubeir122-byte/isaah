// The shape of everything editable from the admin dashboard. Shared by the
// public site, the admin app and the Worker, so all three agree.
import type { ImageKey } from '../data/images';
import type { RegionId } from '../data/episodes';
import type { Lang } from '../i18n';

/** A built-in illustration, or an image uploaded from the dashboard. */
export type ImageRef = ImageKey | { sm: string; lg: string; alt: string };

export interface EpisodeText {
  title: string;
  hook: string;
  acts: { promise: string[]; reality: string[]; breakingPoint: string[]; return: string[] };
}

export interface AudioRef {
  src: string;
  seconds: number;
  wave: number[];
}

export interface EpisodeRecord {
  id: string;
  sort: number;
  published: boolean;
  /** Illustrative story, not a verified testimony: shows a notice. */
  sample: boolean;
  region: RegionId;
  subRegion: string;
  date: string;
  image: ImageRef;
  text: Partial<Record<Lang, EpisodeText>>;
  audio: Partial<Record<Lang, AudioRef>>;
}

export interface ContactSettings {
  signal: string;
  storiesEmail: string;
  generalEmail: string;
}

/**
 * Editable documents, keyed by name. A missing key means "use the text that
 * ships with the site". Keys:
 *   about:<LANG>  contact:<LANG>  strings:<LANG>  lies:<LANG>  regions:<LANG>  settings
 */
export type Docs = Record<string, unknown>;

export interface SiteContent {
  episodes: EpisodeRecord[];
  docs: Docs;
}

export const ACT_KEYS = ['promise', 'reality', 'breakingPoint', 'return'] as const;
