import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

export const inputCls =
  'w-full rounded-lg border border-moss bg-ink px-3 py-2 text-sm text-paper placeholder:text-sage/60 focus:border-gold focus:outline-none disabled:opacity-60';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gold text-ink hover:bg-gold-deep font-bold',
  secondary: 'border border-moss bg-panel-2 text-paper hover:border-gold',
  danger: 'border border-exit/70 bg-exit/15 text-snow hover:bg-exit/30',
  ghost: 'text-sage hover:text-snow',
};

export function Button({ variant = 'secondary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold tracking-wide text-sage uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-sage/80">{hint}</span>}
    </label>
  );
}

export function Card({ title, actions, children }: { title?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-moss/70 bg-panel p-5 md:p-6">
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-serif text-xl font-bold text-snow">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export type Status = { kind: 'ok' | 'error' | 'info'; text: string } | null;

export function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  const cls =
    status.kind === 'error'
      ? 'border-exit/60 bg-exit/10 text-snow'
      : status.kind === 'ok'
        ? 'border-moss bg-forest/40 text-snow'
        : 'border-moss bg-panel-2 text-mist';
  return (
    <p role={status.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>
      {status.text}
    </p>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-3xl font-bold text-snow">{children}</h1>
      {sub && <p className="mt-2 max-w-3xl text-sm text-mist">{sub}</p>}
    </div>
  );
}

/** A password box with a Show/Hide button, so people can check what they typed or what the browser filled in. */
export function PasswordInput({
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        className={`${inputCls} pr-16`}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-pressed={show}
        className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs text-sage hover:text-snow"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

/**
 * Tells the browser's password manager which account a new password belongs
 * to, so it updates the saved password instead of keeping (and auto-filling)
 * the old one.
 */
export function UsernameHint({ email }: { email: string }) {
  return <input type="email" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden className="sr-only" />;
}

/** A textarea that grows with its text. */
export function AutoTextarea({ value, onChange, minRows = 2, ...rest }: { value: string; onChange: (v: string) => void; minRows?: number; placeholder?: string }) {
  const rows = Math.max(minRows, Math.min(18, Math.ceil(value.length / 90) + value.split('\n').length));
  return <textarea {...rest} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} leading-relaxed`} />;
}

export const fmtDate = (unix: number) =>
  new Date(unix * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
