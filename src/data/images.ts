// Every image the site may show. All of them are hand-drawn illustrations made
// by `npm.cmd run illustrations` (scripts/make-illustrations.mjs). They show
// places and objects only, never people, so no source can be recognised.
//
// To add one: draw it in that script, check it by eye, then register it here.

export type ImageKey =
  | 'story-coast'
  | 'story-road'
  | 'story-forest'
  | 'story-mangroves'
  | 'scene-recorder'
  | 'scene-desk'
  | 'scene-homeward'
  | 'scene-door';

export interface SafeImageSource {
  sm: string; // 720px wide, used on phones
  lg: string; // 1400px wide
  alt: string; // describe the scene and objects, never people's identities
}

const src = (key: ImageKey) => ({
  sm: `/images/${key}-sm.webp`,
  lg: `/images/${key}-lg.webp`,
});

export const IMAGES: Record<ImageKey, SafeImageSource> = {
  'story-coast': {
    ...src('story-coast'),
    alt: 'Illustration: a fishing net drying on poles beside a beached boat at dusk, smoke rising over the far coast',
  },
  'story-road': {
    ...src('story-road'),
    alt: 'Illustration: a lone minibus on a straight road leaving the city for dry bush, an open book lying on the verge',
  },
  'story-forest': {
    ...src('story-forest'),
    alt: 'Illustration: a small camp fire with a cooking pot and a tin cup below misty forested mountains',
  },
  'story-mangroves': {
    ...src('story-mangroves'),
    alt: 'Illustration: a small boat with one lantern among mangrove roots at night under a crescent moon',
  },
  'scene-recorder': {
    ...src('scene-recorder'),
    alt: 'Illustration: a field recorder with its red light on, headphones and an open notebook on a wooden table',
  },
  'scene-desk': {
    ...src('scene-desk'),
    alt: 'Illustration: an oil lamp, an open notebook and a cup of tea on a desk below a moonlit window',
  },
  'scene-homeward': {
    ...src('scene-homeward'),
    alt: 'Illustration: a footpath leading out of a dark forest towards a village with lit windows at dawn',
  },
  'scene-door': {
    ...src('scene-door'),
    alt: 'Illustration: a door left open onto a warmly lit room with an empty chair',
  },
};
