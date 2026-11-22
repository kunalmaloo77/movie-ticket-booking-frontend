import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { Spinner } from '../Button';

export const authInputClass =
  'w-full h-11 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-zinc-500 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/20';

const pillBase =
  'w-full h-11 rounded-full inline-flex items-center justify-center gap-2.5 text-[15px] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';

// Provider buttons ("Continue with Google")
export const outlinePillClass = `${pillBase} border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800`;

export const solidPillClass = `${pillBase} bg-brand-600 text-white hover:bg-brand-700`;

export function PillButton({ loading, children, variant = 'solid', ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={variant === 'solid' ? solidPillClass : outlinePillClass}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5 text-sm text-zinc-500">
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      or
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-red-500 mb-3">
      {children}
    </p>
  );
}

export function Logo({ className = '' }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 text-lg font-bold tracking-tight ${className}`}
    >
      <Clapperboard size={22} className="text-brand-600" />
      MovieBook
    </Link>
  );
}

// Full-screen auth page shell: logo only, no navbar
export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="px-4 sm:px-6 h-16 flex items-center">
        <Logo />
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-16 pt-6 sm:pt-0">
        {children}
      </main>
    </div>
  );
}

export function AuthCard({ children }) {
  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl">
      {children}
    </div>
  );
}

export function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#25D366"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.2 1.4z"
      />
    </svg>
  );
}

const RESEND_SECONDS = 30;

// Shared one-time-code step: code input, verify button and resend cooldown.
// onVerify(code) and onResend() should throw an Error with a user-facing message.
export function CodeForm({ destination, channel, onVerify, onResend, onBack, backLabel }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      await onVerify(code);
    } catch (err) {
      setError(err.message);
      setVerifying(false);
    }
  }

  async function handleResend() {
    setError('');
    setResending(true);
    try {
      await onResend();
      setCode('');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        We sent a code {channel} to{' '}
        <span className="font-medium text-zinc-900 dark:text-zinc-100 break-all">
          {destination}
        </span>
        .
      </p>
      <FormError>{error}</FormError>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="Enter code"
        aria-label="One-time code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        className={`${authInputClass} tracking-[0.3em] text-center font-medium`}
        autoFocus
        required
      />
      <div className="mt-5">
        <PillButton
          type="submit"
          loading={verifying}
          disabled={code.length < 6}
        >
          {verifying ? 'Verifying…' : 'Verify and continue'}
        </PillButton>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {backLabel}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2 disabled:no-underline disabled:text-zinc-400 dark:disabled:text-zinc-500 disabled:cursor-not-allowed"
        >
          {resending
            ? 'Sending…'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
