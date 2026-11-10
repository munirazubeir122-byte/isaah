import { useEffect, useState, type FormEvent } from 'react';
import { Copy, KeyRound, Trash2, UserPlus } from 'lucide-react';
import { api, errorText, type Me } from './api';
import { Button, Card, Field, fmtDate, inputCls, PageTitle, StatusLine, type Status } from './ui';

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  disabled: number;
  active: number;
  invite_pending: number;
  locked: number;
  created_at: number;
}

function state(u: UserRow): { text: string; cls: string } {
  if (u.disabled) return { text: 'Disabled', cls: 'bg-exit/20 text-snow' };
  if (u.locked) return { text: 'Locked (wrong passwords)', cls: 'bg-exit/20 text-snow' };
  if (!u.active) return { text: u.invite_pending ? 'Invited' : 'Link expired', cls: 'bg-panel-2 text-sage' };
  return { text: 'Active', cls: 'bg-forest text-gold' };
}

function LinkBox({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-gold/60 bg-ink p-4">
      <p className="mb-2 text-sm text-snow">
        <strong>Sign-in link created.</strong> Send it privately (for example on Signal). It works once and expires in 7 days. This is the only time it is
        shown.
      </p>
      <div className="flex flex-wrap gap-2">
        <input readOnly value={link} className={`${inputCls} flex-1 font-mono text-xs`} onFocus={(e) => e.target.select()} />
        <Button
          onClick={() => {
            void navigator.clipboard.writeText(link).then(() => setCopied(true));
          }}
        >
          <Copy className="h-4 w-4" aria-hidden /> {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function UsersPage({ me }: { me: Me }) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [link, setLink] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'editor' | 'admin'>('editor');

  const reload = () =>
    api<UserRow[]>('admin/users')
      .then(setUsers)
      .catch((e) => setStatus({ kind: 'error', text: errorText(e) }));
  useEffect(() => {
    void reload();
  }, []);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      await reload();
      if (ok) setStatus({ kind: 'ok', text: ok });
    } catch (e) {
      setStatus({ kind: 'error', text: errorText(e) });
    }
  };

  const create = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const r = await api<{ inviteUrl: string }>('admin/users', { body: { email, name, role } });
      setLink(r.inviteUrl);
      setEmail('');
      setName('');
      setRole('editor');
      setStatus(null);
    });
  };

  return (
    <>
      <PageTitle sub="Admins can do everything, including managing users. Editors can edit stories, text and contact details, and see the dashboard.">
        Users
      </PageTitle>
      <div className="space-y-6">
        <Card title="Add a person">
          <form onSubmit={create} className="grid gap-4 md:grid-cols-[1.4fr_1fr_0.8fr_auto] md:items-end">
            <Field label="Email">
              <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Name (optional)">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Role">
              <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as 'editor' | 'admin')}>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Button variant="primary" type="submit">
              <UserPlus className="h-4 w-4" aria-hidden /> Create account
            </Button>
          </form>
          <p className="mt-3 text-xs text-sage">You get a one-time link to send them. They open it and choose their own password; nobody else ever sees it.</p>
          {link && (
            <div className="mt-4">
              <LinkBox link={link} onClose={() => setLink(null)} />
            </div>
          )}
        </Card>

        <StatusLine status={status} />

        <Card title="Team">
          {!users ? (
            <p className="text-sm text-sage">Loading…</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const s = state(u);
                const self = u.id === me.id;
                return (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-moss/60 bg-ink p-3">
                    <div className="min-w-48 flex-1">
                      <div className="font-semibold break-all text-snow">
                        {u.name || u.email} {self && <span className="text-xs font-normal text-sage">(you)</span>}
                      </div>
                      <div className="text-xs break-all text-sage">
                        {u.email} · added {fmtDate(u.created_at)}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.text}</span>
                    <select
                      aria-label={`Role for ${u.email}`}
                      className="rounded-lg border border-moss bg-panel px-2 py-1.5 text-sm"
                      value={u.role}
                      onChange={(e) => run(() => api(`admin/users/${u.id}`, { method: 'PATCH', body: { role: e.target.value } }), 'Role updated.')}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      onClick={() =>
                        run(async () => {
                          const r = await api<{ inviteUrl: string }>(`admin/users/${u.id}/invite`, { method: 'POST' });
                          setLink(r.inviteUrl);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        })
                      }
                      title="Make a new link to set a password (for a forgotten password or an expired invite)"
                    >
                      <KeyRound className="h-4 w-4" aria-hidden /> New sign-in link
                    </Button>
                    {!self && (
                      <Button
                        onClick={() =>
                          run(
                            () => api(`admin/users/${u.id}`, { method: 'PATCH', body: { disabled: !u.disabled } }),
                            u.disabled ? 'Account enabled.' : 'Account disabled and signed out.',
                          )
                        }
                      >
                        {u.disabled ? 'Enable' : 'Disable'}
                      </Button>
                    )}
                    {!self && (
                      <Button
                        variant="danger"
                        aria-label={`Delete ${u.email}`}
                        onClick={() => {
                          if (window.confirm(`Delete the account for ${u.email}? This cannot be undone.`))
                            void run(() => api(`admin/users/${u.id}`, { method: 'DELETE' }), 'Account deleted.');
                        }}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
