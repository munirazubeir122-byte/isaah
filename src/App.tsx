import { useCallback, useEffect, useMemo, useState } from 'react';
import { getEpisodes, REGIONS, type Episode, type RegionId } from './data/episodes';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { HTML_LANG, STRINGS, type Lang } from './i18n';
import { SafetyBar } from './components/SafetyBar';
import { Header, type NavTarget, type PageId, type SectionId } from './components/Header';
import { Hero } from './components/Hero';
import { EpisodeHub } from './components/EpisodeHub';
import { EpisodeDetail } from './components/EpisodeDetail';
import { Interviews, Regions, ShareStoryBand } from './components/HomeSections';
import { AboutPage, ContactPage } from './components/Pages';
import { Footer, PrivacyModal, RecruitmentLies } from './components/Sections';

/**
 * Routes live in the URL hash so a shared link opens the right page on any host:
 *   #/about   #/contact   #/episode/<id>   (anything else is the home page)
 *
 * SAFETY: moving between pages REPLACES the current history entry instead of
 * adding one. The whole visit is then a single entry, so after Quick exit
 * (which replaces that entry with Google) pressing Back cannot reveal which
 * stories someone was reading. Never use `location.hash = ...` or
 * `history.pushState` here.
 */
type Route = { page: 'home' } | { page: PageId } | { page: 'episode'; id: string };

function routeFromHash(): Route {
  const h = window.location.hash;
  const ep = h.match(/^#\/episode\/(.+)$/);
  if (ep) return { page: 'episode', id: ep[1] };
  if (h === '#/about') return { page: 'about' };
  if (h === '#/contact') return { page: 'contact' };
  return { page: 'home' };
}

const SECTIONS: SectionId[] = ['episodes', 'interviews', 'regions'];

export default function App() {
  const [lang, setLang] = useState<Lang>('EN');
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [section, setSection] = useState<SectionId | null>(null);
  const [filter, setFilter] = useState<RegionId | 'ALL'>('ALL');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const player = useAudioPlayer();
  const t = STRINGS[lang];

  const episodes = useMemo(() => getEpisodes(lang), [lang]);
  const episode = route.page === 'episode' ? episodes.find((e) => e.id === route.id) ?? null : null;
  const regionLabel = (id: RegionId) => t[REGIONS.find((r) => r.id === id)!.labelKey];

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  // A language switch changes which recording each episode uses, so stop
  // whatever was playing rather than keep the old language running.
  const { stop } = player;
  useEffect(() => stop(), [lang, stop]);

  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash());
      setSection(null);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const scrollToSection = (id: SectionId) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  /** Show a page without adding a browser history entry (see SAFETY above). */
  const go = useCallback((hash: string) => {
    history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
    setRoute(routeFromHash());
    setSection(null);
    window.scrollTo({ top: 0 });
  }, []);

  const navigate = useCallback((target: NavTarget) => {
    if (target === 'about' || target === 'contact') {
      go(`/${target}`);
      return;
    }
    const onHome = routeFromHash().page === 'home';
    if (!onHome) {
      // Back to the home page (no hash), then scroll once it has rendered.
      history.replaceState(null, '', window.location.pathname);
      setRoute({ page: 'home' });
    }
    if (target === 'home') {
      setSection(null);
      window.scrollTo({ top: 0, behavior: onHome ? 'smooth' : 'auto' });
      return;
    }
    setSection(target);
    if (onHome) scrollToSection(target);
    else requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(target)));
  }, [go]);

  const openEpisode = (ep: Episode) => go(`/episode/${ep.id}`);

  const chooseRegion = (id: RegionId) => {
    setFilter(id);
    setSection('episodes');
    scrollToSection('episodes');
  };

  const active: NavTarget | null =
    route.page === 'about' || route.page === 'contact'
      ? route.page
      : route.page === 'episode'
        ? 'episodes'
        : section && SECTIONS.includes(section)
          ? section
          : 'home';

  let main;
  if (route.page === 'about') main = <AboutPage lang={lang} onContact={() => navigate('contact')} />;
  else if (route.page === 'contact') main = <ContactPage lang={lang} />;
  else if (episode) main = <EpisodeDetail ep={episode} t={t} lang={lang} player={player} onBack={() => navigate('episodes')} />;
  else
    main = (
      <>
        <Hero t={t} onListen={() => navigate('episodes')} onRead={() => navigate('interviews')} />
        <EpisodeHub
          t={t}
          lang={lang}
          episodes={episodes}
          filter={filter}
          onFilter={setFilter}
          player={player}
          onOpen={openEpisode}
        />
        <Interviews t={t} episodes={episodes} regionLabel={regionLabel} onOpen={openEpisode} />
        <Regions t={t} lang={lang} episodes={episodes} onChoose={chooseRegion} />
        <RecruitmentLies t={t} lang={lang} />
        <ShareStoryBand lang={lang} onContact={() => navigate('contact')} />
      </>
    );

  return (
    <div className="min-h-screen bg-night font-sans text-paper selection:bg-forest selection:text-gold">
      <a
        href="#main"
        onClick={(e) => {
          // Move focus without touching the URL: changing the hash would add a
          // history entry and send story pages back to the home page.
          e.preventDefault();
          const m = document.getElementById('main');
          m?.focus();
          m?.scrollIntoView();
        }}
        className="sr-only z-[70] rounded bg-gold px-3 py-2 text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SafetyBar t={t} onOpenPrivacy={() => setPrivacyOpen(true)} />
      <Header t={t} lang={lang} onLangChange={setLang} onNavigate={navigate} active={active} />
      <main id="main" tabIndex={-1} className="outline-none">{main}</main>
      <Footer t={t} />
      {privacyOpen && <PrivacyModal t={t} onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
