import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PasswordInput from './PasswordInput';
import PasswordStrength from './auth/PasswordStrength';
import {
  authInputClass,
  authLabelClass,
  CodeForm,
  FormError,
  GoogleIcon,
  OrDivider,
  PillButton,
} from './auth/AuthUI';

// Sign-in popup. Views:
//   start    - Continue with Google, or email -> "Continue with password" / "Email me a code"
//   password - sign in with a password (links to forgot / create account)
//   signup   - choose a password (+ confirm); an emailed code verifies the email
//   code     - enter an emailed code (purpose: login or verify_email)
//   forgot   - request a reset code
//   reset    - code + new password
const TITLES = {
  start: 'Sign in or create an account',
  password: 'Sign in',
  signup: 'Create your account',
  code: 'Check your email',
  forgot: 'Reset your password',
  reset: 'Choose a new password',
};

const BACK = { password: 'start', signup: 'password', forgot: 'password', reset: 'forgot' };

const MAX_PASSWORD = 128;
const MIN_PASSWORD = 8;

export default function LoginModal({ from, onClose }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('start');
  const [codePurpose, setCodePurpose] = useState('login');
  const [codeBack, setCodeBack] = useState('start');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const address = email.trim();

  function go(next, { message = '' } = {}) {
    setError('');
    setInfo(message);
    setView(next);
  }

  function showCode(purpose, back, message = '') {
    setCodePurpose(purpose);
    setCodeBack(back);
    go('code', { message });
  }

  function finish() {
    onClose();
    if (from) navigate(from);
  }

  // Runs an async step with a busy state and a user-facing error
  async function run(step) {
    setError('');
    setBusy(true);
    try {
      await step();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      return err;
    } finally {
      setBusy(false);
    }
    return null;
  }

  function handleGoogle() {
    auth.startGoogle(from || location.pathname + location.search);
  }

  async function handleStart(e) {
    e.preventDefault();
    const method = e.nativeEvent.submitter?.value;
    if (method === 'code') {
      await run(async () => {
        await auth.sendLoginCode(address);
        showCode('login', 'start');
      });
    } else {
      go('password');
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    const err = await run(async () => {
      await auth.passwordLogin(address, password);
      finish();
    });
    if (err?.code === 'EMAIL_NOT_VERIFIED') {
      showCode('verify_email', 'password', 'Your email isn’t verified yet. We sent you a new code.');
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    await run(async () => {
      await auth.signup(address, password);
      showCode('verify_email', 'signup');
    });
  }

  async function handleForgot(e) {
    e.preventDefault();
    await run(async () => {
      await auth.forgotPassword(address);
      setResetCode('');
      setPassword('');
      setConfirm('');
      go('reset', { message: 'If an account exists for this email, we sent a reset code.' });
    });
  }

  async function handleReset(e) {
    e.preventDefault();
    await run(async () => {
      await auth.resetPassword(address, resetCode, password);
      finish();
    });
  }

  // Keep the browser's own validation message in sync for the confirm field
  function onConfirmChange(e) {
    setConfirm(e.target.value);
    e.target.setCustomValidity(e.target.value && e.target.value !== password ? 'Passwords don’t match.' : '');
  }

  const passwordMismatch = confirm.length > 0 && confirm !== password;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative w-full sm:max-w-[440px] max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-6 sm:px-7 pt-6 pb-7 shadow-2xl"
      >
        {view !== 'start' && (
          <button
            type="button"
            onClick={() => go(view === 'code' ? codeBack : BACK[view] ?? 'start')}
            aria-label="Back"
            className="absolute left-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <X size={18} />
        </button>

        <h2 id="login-modal-title" className="text-xl font-semibold text-center mt-6 mb-6">
          {TITLES[view]}
        </h2>

        {info && (
          <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {info}
          </p>
        )}

        {view === 'start' && (
          <>
            <PillButton variant="outline" onClick={handleGoogle}>
              <GoogleIcon />
              Continue with Google
            </PillButton>

            <OrDivider />

            <form onSubmit={handleStart}>
              <label htmlFor="login-email" className={authLabelClass}>
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                enterKeyHint="next"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                required
                autoFocus
              />
              <div className="mt-4">
                <FormError>{error}</FormError>
              </div>
              <div className="mt-2 flex flex-col gap-3">
                <PillButton type="submit" name="method" value="password" disabled={busy}>
                  Continue with password
                </PillButton>
                <PillButton type="submit" name="method" value="code" variant="outline" loading={busy}>
                  Email me a code
                </PillButton>
              </div>
            </form>
          </>
        )}

        {view === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <EmailSummary email={address} onChange={() => go('start')} />
            {/* Lets password managers save the email together with the password */}
            <input type="email" name="email" autoComplete="username" value={address} readOnly hidden />
            <label htmlFor="login-password" className={authLabelClass}>
              Password
            </label>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              enterKeyHint="done"
              maxLength={MAX_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
              wrapperClassName=""
              autoFocus
              required
            />
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => go('forgot')}
                className="text-sm text-zinc-600 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Forgot password?
              </button>
            </div>
            <div className="mt-3">
              <FormError>{error}</FormError>
            </div>
            <div className="mt-2">
              <PillButton type="submit" loading={busy}>
                Sign in
              </PillButton>
            </div>
            <p className="mt-5 text-sm text-center text-zinc-600 dark:text-zinc-400">
              New here?{' '}
              <button
                type="button"
                onClick={() => {
                  setPassword('');
                  setConfirm('');
                  go('signup');
                }}
                className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-2"
              >
                Create an account
              </button>
            </p>
          </form>
        )}

        {(view === 'signup' || view === 'reset') && (
          <form onSubmit={view === 'signup' ? handleSignup : handleReset}>
            <EmailSummary email={address} onChange={() => go('start')} />
            <input type="email" name="email" autoComplete="username" value={address} readOnly hidden />

            {view === 'reset' && (
              <div className="mb-4">
                <label htmlFor="reset-code" className={authLabelClass}>
                  6-digit code from the email
                </label>
                <input
                  id="reset-code"
                  name="one-time-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  className={`${authInputClass} tracking-[0.3em] text-center font-medium`}
                  autoFocus
                  required
                />
              </div>
            )}

            <label htmlFor="new-password" className={authLabelClass}>
              {view === 'signup' ? 'Password' : 'New password'}
            </label>
            <PasswordInput
              id="new-password"
              name="new-password"
              autoComplete="new-password"
              enterKeyHint="next"
              minLength={MIN_PASSWORD}
              maxLength={MAX_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
              wrapperClassName=""
              aria-describedby="password-strength"
              autoFocus={view === 'signup'}
              required
            />
            <PasswordStrength id="password-strength" password={password} userInputs={[address]} />

            <label htmlFor="confirm-password" className={`${authLabelClass} mt-4`}>
              Confirm password
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              enterKeyHint="done"
              maxLength={MAX_PASSWORD}
              value={confirm}
              onChange={onConfirmChange}
              className={authInputClass}
              wrapperClassName=""
              aria-invalid={passwordMismatch}
              aria-describedby={passwordMismatch ? 'confirm-error' : undefined}
              required
            />
            {passwordMismatch && (
              <p id="confirm-error" className="mt-1 text-sm text-red-500">
                Error: passwords don’t match.
              </p>
            )}

            <div className="mt-4">
              <FormError>{error}</FormError>
            </div>
            <div className="mt-2">
              <PillButton type="submit" loading={busy} disabled={passwordMismatch}>
                {view === 'signup' ? 'Create account' : 'Reset password'}
              </PillButton>
            </div>
            {view === 'signup' && (
              <p className="mt-3 text-xs text-zinc-500">
                We’ll email you a code to confirm your address.
              </p>
            )}
            {view === 'reset' && (
              <p className="mt-3 text-xs text-zinc-500">
                Resetting your password signs you out on all other devices.
              </p>
            )}
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot}>
            <label htmlFor="forgot-email" className={authLabelClass}>
              Email
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              required
              autoFocus
            />
            <div className="mt-4">
              <FormError>{error}</FormError>
            </div>
            <div className="mt-2">
              <PillButton type="submit" loading={busy}>
                Email me a reset code
              </PillButton>
            </div>
          </form>
        )}

        {view === 'code' && (
          <CodeForm
            destination={address}
            channel="by email"
            submitLabel={codePurpose === 'login' ? 'Sign in' : 'Verify email'}
            onVerify={async (code) => {
              if (codePurpose === 'login') await auth.verifyLoginCode(address, code);
              else await auth.verifyEmail(address, code);
              finish();
            }}
            onResend={() =>
              codePurpose === 'login'
                ? auth.sendLoginCode(address)
                : auth.resendVerification(address)
            }
            onBack={() => go(codeBack)}
            backLabel="Back"
          />
        )}
      </div>
    </div>
  );
}

function EmailSummary({ email, onChange }) {
  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
      <span className="font-medium text-zinc-900 dark:text-zinc-100 break-all">{email}</span>{' '}
      <button
        type="button"
        onClick={onChange}
        className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        Change
      </button>
    </p>
  );
}
