// Holds the content the server sent. The Worker embeds it in the page as
// <script type="application/json" id="site-content">, so the first render
// already shows the edited text. Every accessor falls back to the content
// that ships with the site when a piece has not been edited.
import type { SiteContent } from './types';

let remote: SiteContent | null = readEmbedded();

function readEmbedded(): SiteContent | null {
  // Reached through globalThis: this file is also compiled for the Worker,
  // which has no document.
  const d = (globalThis as { document?: { getElementById(id: string): { textContent: string | null } | null } }).document;
  const el = d?.getElementById('site-content');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as SiteContent;
  } catch {
    return null;
  }
}

export const hasRemote = () => remote !== null;
export const remoteEpisodes = () => remote?.episodes ?? null;

export function setRemote(c: SiteContent) {
  remote = c;
}

/** An edited document, or undefined when the shipped text should be used. */
export function doc<T>(key: string): T | undefined {
  return remote?.docs?.[key] as T | undefined;
}
