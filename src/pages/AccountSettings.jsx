import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Mail } from 'lucide-react';
import { get, put, del } from '../api';
import { useAuth } from '../hooks/useAuth';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/auth/PasswordStrength';
import {
  authInputClass,
  authLabelClass,
  FormError,
  GoogleIcon,
  PillButton,
} from '../components/auth/AuthUI';
import { showConfirm, showSuccess } from '../utils/swal_utils';

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function MethodRow({ icon, name, detail, action }) {
  return (
    <li className="flex items-center gap-3 py-3 border-b last:border-b-0 border-zinc-100 dark:border-zinc-800">
      <span className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-zinc-500 truncate">{detail}</p>
      </div>
      {action}
    </li>
  );
}

export default function AccountSettings() {
  const { user, linkGoogle, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [methods, setMethods] = useState(null);
  const [loadError, setLoadError] = useState('');

  const loadMethods = useCallback(async () => {
    try {
      const { data } = await get('/account/methods');
      setMethods(data);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    get('/account/methods')
      .then(({ data }) => {
        if (!cancelled) setMethods(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnlink() {
    const ok = await showConfirm('You will no longer be able to sign in with this Google account.', {
      title: 'Unlink Google?',
      confirmText: 'Unlink',
      danger: true,
    });
    if (!ok) return;
    try {
      await del('/account/identities/google');
      showSuccess('Google has been unlinked.');
      loadMethods();
    } catch (err) {
      setLoadError(err.message);
    }
  }

  async function handleLogoutAll() {
    const ok = await showConfirm('This signs you out on every device, including this one.', {
      title: 'Log out of all devices?',
      confirmText: 'Log out everywhere',
      danger: true,
    });
    if (!ok) return;
    await logoutAll();
    navigate('/');
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="text-sm text-zinc-500 mt-1 break-all">{user?.email}</p>
      </div>

      <FormError>{loadError}</FormError>

      <Section title="Ways to sign in">
        {!methods ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <ul>
            <MethodRow
              icon={<Mail size={16} />}
              name="Email code"
              detail={methods.emailCode ? `Codes are sent to ${methods.email}` : 'Verify your email to use codes'}
            />
            <MethodRow
              icon={<KeyRound size={16} />}
              name="Password"
              detail={methods.password ? 'Set' : 'Not set'}
            />
            <MethodRow
              icon={<GoogleIcon size={16} />}
              name="Google"
              detail={methods.google.linked ? `Linked to ${methods.google.email}` : 'Not linked'}
              action={
                methods.google.linked ? (
                  <button
                    type="button"
                    onClick={handleUnlink}
                    disabled={!methods.password}
                    title={methods.password ? undefined : 'Add a password first'}
                    className="text-sm font-medium text-red-600 hover:underline disabled:text-zinc-400 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    Unlink
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={linkGoogle}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Link
                  </button>
                )
              }
            />
          </ul>
        )}
        {methods?.google.linked && !methods.password && (
          <p className="mt-3 text-xs text-zinc-500">
            Add a password before unlinking Google, so you can still sign in.
          </p>
        )}
      </Section>

      {methods && (
        <Section title={methods.password ? 'Change password' : 'Add a password'}>
          <PasswordForm
            hasPassword={methods.password}
            email={methods.email}
            onSaved={loadMethods}
          />
        </Section>
      )}

      <Section title="Sessions">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          {methods
            ? `You are signed in on ${methods.activeSessions} ${methods.activeSessions === 1 ? 'device' : 'devices'}.`
            : ' '}
        </p>
        <button
          type="button"
          onClick={handleLogoutAll}
          className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"
        >
          <LogOut size={16} />
          Log out of all devices
        </button>
      </Section>
    </main>
  );
}

function PasswordForm({ hasPassword, email, onSaved }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== next;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await put('/account/password', {
        newPassword: next,
        ...(hasPassword ? { currentPassword: current } : {}),
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      showSuccess(
        hasPassword ? 'Password changed. Other devices have been signed out.' : 'Password added.'
      );
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
      {hasPassword && (
        <>
          <label htmlFor="current-password" className={authLabelClass}>
            Current password
          </label>
          <PasswordInput
            id="current-password"
            name="current-password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={authInputClass}
            wrapperClassName="mb-4"
            required
          />
        </>
      )}
      <label htmlFor="settings-new-password" className={authLabelClass}>
        New password
      </label>
      <PasswordInput
        id="settings-new-password"
        name="new-password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className={authInputClass}
        wrapperClassName=""
        aria-describedby="settings-password-strength"
        required
      />
      <PasswordStrength id="settings-password-strength" password={next} userInputs={[email]} />
      <label htmlFor="settings-confirm-password" className={`${authLabelClass} mt-4`}>
        Confirm new password
      </label>
      <PasswordInput
        id="settings-confirm-password"
        name="confirm-password"
        autoComplete="new-password"
        maxLength={128}
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          e.target.setCustomValidity(
            e.target.value && e.target.value !== next ? 'Passwords don’t match.' : ''
          );
        }}
        className={authInputClass}
        wrapperClassName=""
        aria-invalid={mismatch}
        aria-describedby={mismatch ? 'settings-confirm-error' : undefined}
        required
      />
      {mismatch && (
        <p id="settings-confirm-error" className="mt-1 text-sm text-red-500">
          Error: passwords don’t match.
        </p>
      )}
      <div className="mt-4">
        <FormError>{error}</FormError>
      </div>
      <div className="mt-2 sm:max-w-[220px]">
        <PillButton type="submit" loading={busy} disabled={mismatch}>
          {hasPassword ? 'Change password' : 'Add password'}
        </PillButton>
      </div>
    </form>
  );
}
