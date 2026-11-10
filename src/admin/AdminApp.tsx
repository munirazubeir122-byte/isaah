import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BarChart3, ExternalLink, FileText, Film, KeyRound, LogOut, Mail, Users as UsersIcon } from 'lucide-react';
import { api, errorText, type Me } from './api';
import { Button, Card, Field, inputCls, PageTitle, PasswordInput, StatusLine, UsernameHint, type Status } from './ui';
import { Dashboard } from './Dashboard';
import { EpisodeEditor, EpisodeList } from './Episodes';
import { ContactEditor, TextEditor } from './TextPages';
import { UsersPage } from './Users';

/** Admin routes live in the hash: #/, #/episodes, #/episodes/ep-01, #/invite/<token>, … */
function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const goto = (path: string) => {
  window.location.hash = path;
};

export default function AdminApp() {
  const route = useHashRoute();
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  const refreshMe = useCallback(() => {
    api<{ user: Me | null }>('auth/me')
      .then((r) => setMe(r.user))
      .catch(() => setMe(null));
  }, []);
  useEffect(refreshMe, [refreshMe]);

  const invite = route.match(/^\/invite\/([A-Za-z0-9_-]+)$/);
  if (invite) return <InvitePage token={invite[1]} onDone={refreshMe} />;
  if (me === undefined) return <Shell>{null}</Shell>;
  if (!me) return <LoginPage onDone={refreshMe} />;

  let page;
  const ep = route.match(/^\/episodes\/([a-z0-9-]+)$/);
  if (ep) page = <EpisodeEditor id={ep[1]} me={me} />;
  else if (route === '/episodes') page = <EpisodeList me={me} />;
  else if (route === '/text') page = <TextEditor />;
  else if (route === '/contact') page = <ContactEditor />;
  else if (route === '/users' && me.role === 'admin') page = <UsersPage me={me} />;
  else if (route === '/account') page = <AccountPage me={me} />;
  else page = <Dashboard />;

  const logout = async () => {
    await api('auth/logout', { method: 'POST' }).catch(() => {});
    setMe(null);
    goto('/');
  };

  const nav = [
    { to: '/', label: 'Dashboard', icon: BarChart3 },
    { to: '/episodes', label: 'Stories', icon: Film },
    { to: '/text', label: 'Page text', icon: FileText },
    { to: '/contact', label: 'Contact details', icon: Mail },
    ...(me.role === 'admin' ? [{ to: '/users', label: 'Users', icon: UsersIcon }] : []),
    { to: '/account', label: 'My account', icon: KeyRound },
  ];
  const active = (to: string) => (to === '/' ? route === '/' : route.startsWith(to));

  return (
    <Shell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
        <aside className="md:w-56 md:shrink-0">
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col">
            {nav.map(({ to, label, icon: Icon }) => (
              <a
                key={to}
                href={`#${to}`}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active(to) ? 'bg-forest text-gold' : 'text-mist hover:bg-panel hover:text-snow'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-6 hidden border-t border-moss/50 pt-4 text-xs text-sage md:block">
            Signed in as
            <div className="mt-1 font-semibold break-all text-paper">{me.name || me.email}</div>
            <div className="capitalize">{me.role}</div>
            <Button variant="ghost" className="mt-3 -ml-3" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </Button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{page}</main>
      </div>
      <div className="px-4 pb-6 md:hidden">
        <Button variant="secondary" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4" aria-hidden /> Sign out ({me.email})
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-night font-sans text-paper">
      <header className="border-b border-moss/50 bg-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <a href="#/" className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-snow">ISLAAH</span>
            <span className="text-xs tracking-widest text-gold uppercase">Admin</span>
          </a>
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-sage hover:text-snow">
            View site <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </header>
      {children}
    </div>
  );
}

function CenteredCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="mb-6 font-serif text-2xl font-bold text-snow">{title}</h1>
          {children}
        </Card>
      </div>
    </Shell>
  );
}

function LoginPage({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await api('auth/login', { body: { email: email.trim(), password } });
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <CenteredCard title="Sign in">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input className={inputCls} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={password} onChange={setPassword} />
        </Field>
        <StatusLine status={status} />
        <Button variant="primary" type="submit" disabled={busy} className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-xs text-sage">Forgot your password? Ask an admin for a new sign-in link.</p>
      </form>
    </CenteredCard>
  );
}

function InvitePage({ token, onDone }: { token: string; onDone: () => void }) {
  const [info, setInfo] = useState<{ email: string; name: string } | null>(null);
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ email: string; name: string }>(`auth/invite?token=${encodeURIComponent(token)}`)
      .then((r) => {
        setInfo(r);
        setName(r.name);
      })
      .catch((e) => setStatus({ kind: 'error', text: errorText(e) }));
  }, [token]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) return setStatus({ kind: 'error', text: 'The two passwords are different.' });
    setBusy(true);
    try {
      await api('auth/invite', { body: { token, password: pw, name } });
      // Remove the one-time token from the address bar and history, then
      // tell the router (replaceState alone does not fire hashchange).
      history.replaceState(null, '', '/admin/#/');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <CenteredCard title="Set your password">
      {!info ? (
        <StatusLine status={status ?? { kind: 'info', text: 'Checking your link…' }} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <UsernameHint email={info.email} />
          <p className="text-sm text-mist">
            Account: <strong className="text-snow">{info.email}</strong>
          </p>
          <Field label="Your name" hint="Shown to other team members in the dashboard. A first name is enough.">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label="New password" hint="At least 12 characters. A few random words work well.">
            <PasswordInput autoComplete="new-password" minLength={12} value={pw} onChange={setPw} />
          </Field>
          <Field label="Type it again">
            <PasswordInput autoComplete="new-password" value={pw2} onChange={setPw2} />
          </Field>
          <StatusLine status={status} />
          <Button variant="primary" type="submit" disabled={busy} className="w-full">
            {busy ? 'Saving…' : 'Save password and sign in'}
          </Button>
        </form>
      )}
    </CenteredCard>
  );
}

function AccountPage({ me }: { me: Me }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== next2) return setStatus({ kind: 'error', text: 'The two new passwords are different.' });
    try {
      await api('auth/password', { body: { current, next } });
      setCurrent('');
      setNext('');
      setNext2('');
      setStatus({ kind: 'ok', text: 'Password changed. You have been signed out everywhere else.' });
    } catch (err) {
      setStatus({ kind: 'error', text: errorText(err) });
    }
  };
  return (
    <>
      <PageTitle sub={`${me.email} · ${me.role}`}>My account</PageTitle>
      <Card title="Change password">
        <form onSubmit={submit} className="max-w-md space-y-4">
          <UsernameHint email={me.email} />
          <Field label="Current password">
            <PasswordInput autoComplete="current-password" value={current} onChange={setCurrent} />
          </Field>
          <Field label="New password" hint="At least 12 characters.">
            <PasswordInput autoComplete="new-password" minLength={12} value={next} onChange={setNext} />
          </Field>
          <Field label="Type the new password again">
            <PasswordInput autoComplete="new-password" value={next2} onChange={setNext2} />
          </Field>
          <StatusLine status={status} />
          <Button variant="primary" type="submit">
            Change password
          </Button>
        </form>
      </Card>
    </>
  );
}
