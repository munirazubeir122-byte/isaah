import { AlertTriangle, Lock, Mail, MessageSquare, PenLine, ShieldCheck } from 'lucide-react';
import { CONTACT } from '../data/contact';
import { aboutContent, contactContent } from '../data/pages';
import type { Lang } from '../i18n';
import type { ImageKey } from '../data/images';
import { SafeImage } from './SafeImage';
import { ShareStoryBand } from './HomeSections';

function PageHeader({ title, lead, image }: { title: string; lead: string; image: ImageKey }) {
  return (
    <header className="relative overflow-hidden border-b border-moss/30 bg-ink">
      <SafeImage image={image} priority className="absolute inset-0" overlay="bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <h1 className="max-w-3xl font-serif text-4xl leading-tight font-extrabold text-snow md:text-5xl">{title}</h1>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-mist md:text-xl">{lead}</p>
      </div>
    </header>
  );
}

export function AboutPage({ lang, onContact }: { lang: Lang; onContact: () => void }) {
  const a = aboutContent(lang);
  return (
    <>
      <PageHeader title={a.title} lead={a.lead} image="scene-desk" />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20 lg:px-8">
        <section>
          <h2 className="mb-6 font-serif text-3xl font-bold text-snow">{a.missionTitle}</h2>
          <ul className="space-y-5">
            {a.mission.map((m) => (
              <li key={m} className="border-l-2 border-gold pl-5 font-serif text-lg leading-relaxed text-mist">
                {m}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-6 font-serif text-3xl font-bold text-snow">{a.visionTitle}</h2>
          <p className="font-serif text-2xl leading-snug text-paper">{a.vision}</p>
        </section>
      </div>

      {/* Journalist profile. No portrait: the no-faces rule applies to staff too. */}
      <section className="border-y border-moss/30 bg-panel/40">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:py-20 lg:px-8">
          <div>
            <h2 className="mb-6 font-serif text-3xl font-bold text-snow">{a.journalistTitle}</h2>
            <div className="flex items-center gap-4 rounded-xl border border-moss bg-ink p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold bg-forest text-gold">
                <PenLine className="h-6 w-6" aria-hidden />
              </span>
              <span>
                <span className="block font-serif text-xl font-bold text-white">{a.journalistName}</span>
                <span className="text-sm text-gold">{a.journalistRole}</span>
              </span>
            </div>
          </div>
          <div className="space-y-4 font-serif text-lg leading-relaxed text-mist md:pt-16">
            {a.journalistBio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <h2 className="mb-10 font-serif text-3xl font-bold text-snow">{a.principlesTitle}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {a.principles.map((p) => (
            <div key={p.title} className="rounded-xl border border-moss bg-ink p-6">
              <ShieldCheck className="mb-4 h-5 w-5 text-gold" aria-hidden />
              <h3 className="mb-2 font-serif text-lg font-bold text-white">{p.title}</h3>
              <p className="text-sm leading-relaxed text-mist">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ShareStoryBand lang={lang} onContact={onContact} />
    </>
  );
}

export function ContactPage({ lang }: { lang: Lang }) {
  const c = contactContent(lang);
  const channels = [
    CONTACT.signal && {
      icon: MessageSquare,
      label: c.signalLabel,
      value: CONTACT.signal,
      href: `https://signal.me/#p/${CONTACT.signal.replace(/\s/g, '')}`,
    },
    CONTACT.storiesEmail && { icon: Lock, label: c.storiesEmailLabel, value: CONTACT.storiesEmail, href: `mailto:${CONTACT.storiesEmail}` },
    CONTACT.generalEmail && { icon: Mail, label: c.generalEmailLabel, value: CONTACT.generalEmail, href: `mailto:${CONTACT.generalEmail}` },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string }[];

  return (
    <>
      <PageHeader title={c.title} lead={c.lead} image="scene-door" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <section className="max-w-3xl">
          <h2 className="mb-5 font-serif text-3xl font-bold text-snow">{c.whyTitle}</h2>
          <div className="space-y-4 font-serif text-lg leading-relaxed text-mist">
            {c.why.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-8 font-serif text-3xl font-bold text-snow">{c.promisesTitle}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {c.promises.map((p) => (
              <div key={p.title} className="rounded-xl border border-moss bg-panel p-6">
                <h3 className="mb-2 flex items-center gap-2 font-serif text-lg font-bold text-white">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-mist">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-gold/50 bg-ink p-6 md:p-8">
            <h2 className="mb-2 font-serif text-2xl font-bold text-snow">{c.channelsTitle}</h2>
            <p className="mb-6 text-sm leading-relaxed text-sage">{c.channelsIntro}</p>
            {channels.length ? (
              <ul className="space-y-3">
                {channels.map(({ icon: Icon, label, value, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-lg border border-moss bg-panel p-4 transition hover:border-gold"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                      <span>
                        <span className="block text-xs text-sage">{label}</span>
                        <span className="font-semibold break-all text-white">{value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-moss p-4 text-sm text-mist">{c.noChannels}</p>
            )}
          </section>

          <section className="rounded-xl border border-moss bg-panel p-6 md:p-8">
            <h2 className="mb-4 font-serif text-2xl font-bold text-snow">{c.safetyTitle}</h2>
            <ul className="space-y-3">
              {c.safety.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm leading-relaxed text-mist">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8 flex items-start gap-4 rounded-xl border border-exit/60 bg-exit/10 p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-exit" aria-hidden />
          <div>
            <h2 className="mb-1 font-serif text-lg font-bold text-white">{c.dangerTitle}</h2>
            <p className="text-sm leading-relaxed text-mist">{c.danger}</p>
          </div>
        </section>
      </div>
    </>
  );
}
