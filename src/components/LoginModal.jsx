import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import {
  authInputClass,
  CodeForm,
  FormError,
  OrDivider,
  PillButton,
} from './auth/AuthUI';

// Login/signup popup. Views:
//   options  - Google, or email -> emailed code (default)
//   password - email + password, then the same emailed code verifies the email
//   code     - one-time code entry (token is only issued after this step)
export default function LoginModal({ from, onClose }) {
  const [view, setView] = useState('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usedPassword, setUsedPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { googleLogin, sendEmailCode, startPasswordLogin, verifyEmailCode } =
    useAuth();
  const navigate = useNavigate();

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

  function finish() {
    onClose();
    if (from) navigate(from);
  }

  async function handleGoogle(credentialResponse) {
    setError('');
    try {
      await googleLogin(credentialResponse.credential);
      finish();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEmailContinue(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await sendEmailCode(email.trim());
      setUsedPassword(false);
      setView('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handlePasswordChoice() {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setError('');
    setView('password');
  }

  async function handlePasswordContinue(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await startPasswordLogin(email.trim(), password);
      setUsedPassword(true);
      setView('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    setError('');
    setView(view === 'code' && usedPassword ? 'password' : 'options');
  }

  const title = view === 'code' ? 'Verify your email' : 'Log in or Signup';

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
        {view !== 'options' && (
          <button
            type="button"
            onClick={goBack}
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

        <h2
          id="login-modal-title"
          className="text-xl font-semibold text-center mt-6 mb-8"
        >
          {title}
        </h2>

        {view === 'options' && (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogle}
                  onError={() =>
                    setError('Google sign-in failed. Please try again.')
                  }
                  text="continue_with"
                  shape="pill"
                  width="380"
                />
              </div>
            </div>

            <OrDivider />

            <form onSubmit={handleEmailContinue}>
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                required
              />
              <div className="mt-4">
                <FormError>{error}</FormError>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <PillButton type="submit" loading={busy}>
                  Continue
                </PillButton>
                <PillButton
                  variant="outline"
                  onClick={handlePasswordChoice}
                  disabled={busy}
                >
                  Continue with password
                </PillButton>
              </div>
            </form>
          </>
        )}

        {view === 'password' && (
          <form onSubmit={handlePasswordContinue}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Signing in as{' '}
              <span className="font-medium text-zinc-900 dark:text-zinc-100 break-all">
                {email.trim()}
              </span>
              . We&apos;ll email a code to verify it&apos;s you.
            </p>
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
              autoFocus
              required
            />
            <p className="mt-2 text-xs text-zinc-500">
              New here? This becomes your password once your email is verified.
            </p>
            <div className="mt-4">
              <FormError>{error}</FormError>
            </div>
            <div className="mt-4">
              <PillButton type="submit" loading={busy}>
                Continue
              </PillButton>
            </div>
          </form>
        )}

        {view === 'code' && (
          <CodeForm
            destination={email.trim()}
            channel="by email"
            onVerify={async (code) => {
              await verifyEmailCode(email.trim(), code);
              finish();
            }}
            onResend={() =>
              usedPassword
                ? startPasswordLogin(email.trim(), password)
                : sendEmailCode(email.trim())
            }
            onBack={goBack}
            backLabel="Change"
          />
        )}
      </div>
    </div>
  );
}
