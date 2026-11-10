import { IMAGES } from '../data/images';
import type { ImageRef } from '../content/types';

interface Props {
  image: ImageRef;
  className?: string;
  /** Hero images load immediately; everything else waits until scrolled near. */
  priority?: boolean;
  /** Tailwind classes for the dark overlay gradient. */
  overlay?: string;
}

/**
 * The only way the site renders a photo. It reads from the registry of
 * pre-cropped, face-free, metadata-stripped files (or a dashboard upload,
 * which the dashboard re-encodes to strip metadata) and serves the small
 * version to phones.
 */
export function SafeImage({
  image,
  className = '',
  priority = false,
  overlay = 'bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10',
}: Props) {
  const img = typeof image === 'string' ? IMAGES[image] ?? IMAGES['story-coast'] : image;
  return (
    <div className={`${className.includes('absolute') ? '' : 'relative'} overflow-hidden bg-panel ${className}`}>
      <img
        src={img.sm}
        srcSet={`${img.sm} 720w, ${img.lg} 1400w`}
        sizes="(max-width: 768px) 100vw, 50vw"
        alt={img.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className={`absolute inset-0 ${overlay}`} />
    </div>
  );
}
