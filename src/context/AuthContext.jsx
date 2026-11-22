import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { get, post } from '../api';
import AuthContext from './authContextObject';
import { showError, showSuccess } from '../utils/swal_utils';

// Session state lives in httpOnly cookies managed by the backend. This
// context only keeps the current user in memory and exposes the auth flows.

const LEGACY_KEYS = ['token', 'user'];

// Messages for ?auth= / ?auth_error= after the Google redirect
const AUTH_NOTICES = {
  google_linked: ['Google is now linked to your account.', 'Google linked'],
  account_secured: [
    'You confirmed this email. The account had been created earlier without confirmation, so we removed its old password and signed out other sessions. You can set a new password in Account settings.',
    'Account secured',
  ],
};

const AUTH_ERRORS = {
  GOOGLE_AUTH_CANCELLED: 'Google sign-in was cancelled.',
  GOOGLE_EMAIL_UNVERIFIED: 'Your Google email address is not verified.',
  GOOGLE_NOT_CONFIGURED: 'Google sign-in is not available right now.',
  GOOGLE_ALREADY_LINKED: 'This account is already linked to a different Google account.',
  GOOGLE_IN_USE: 'That Google account is already used by another MovieBook account.',
  SESSION_EXPIRED: 'Your session expired. Please sign in and try again.',
};

// Tokens used to live in localStorage. Remove them and say why once.
function purgeLegacyStorage() {
  try {
    const hadLegacy = LEGACY_KEYS.some((key) => localStorage.getItem(key) !== null);
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    return hadLegacy;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // null = closed; otherwise { from } — the path to return to after login
  const [loginModal, setLoginModal] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const hadLegacy = purgeLegacyStorage();
    refreshUser().then((current) => {
      setLoading(false);
      if (hadLegacy && !current) {
        showSuccess(
          'We upgraded how sign-in works to keep your account safer. Please sign in again.',
          'Please sign in again'
        );
      }
    });
  }, [refreshUser]);

  // Result of a Google redirect: show it once, then clean the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const notice = params.get('auth');
    const error = params.get('auth_error');
    if (!notice && !error) return;
    params.delete('auth');
    params.delete('auth_error');
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });

    if (error) {
      showError(AUTH_ERRORS[error] ?? 'Google sign-in failed. Please try again.', 'Sign-in failed');
    } else if (AUTH_NOTICES[notice]) {
      showSuccess(...AUTH_NOTICES[notice]);
    }
    refreshUser();
  }, [location.pathname, location.search, navigate, refreshUser]);

  const openLogin = useCallback((from) => {
    setLoginModal({ from: from ?? null });
  }, []);

  const closeLogin = useCallback(() => setLoginModal(null), []);

  // Every flow that ends in a session returns { user, notice }
  const acceptSession = useCallback((data) => {
    setUser(data.user);
    if (AUTH_NOTICES[data.notice] && data.notice !== 'google_linked') {
      showSuccess(...AUTH_NOTICES[data.notice]);
    }
    return data;
  }, []);

  const actions = useMemo(
    () => ({
      passwordLogin: async (email, password) =>
        acceptSession((await post('/auth/password/login', { email, password })).data),
      signup: (email, password) => post('/auth/signup', { email, password }),
      verifyEmail: async (email, code) =>
        acceptSession((await post('/auth/email/verify', { email, code })).data),
      resendVerification: (email) => post('/auth/email/resend', { email }),
      sendLoginCode: (email) => post('/auth/code/send', { email }),
      verifyLoginCode: async (email, code) =>
        acceptSession((await post('/auth/code/verify', { email, code })).data),
      forgotPassword: (email) => post('/auth/password/forgot', { email }),
      resetPassword: async (email, code, newPassword) =>
        acceptSession((await post('/auth/password/reset', { email, code, newPassword })).data),
      adminLogin: async (email, password) =>
        acceptSession((await post('/admin/login', { email, password })).data),
      // Full-page redirect: the backend runs the OAuth code flow with PKCE
      startGoogle: (returnTo = '/') => {
        window.location.assign(`/api/auth/google/start?${new URLSearchParams({ returnTo })}`);
      },
      linkGoogle: () => {
        window.location.assign(
          `/api/auth/google/start?${new URLSearchParams({ intent: 'link', returnTo: '/account' })}`
        );
      },
    }),
    [acceptSession]
  );

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    await post('/auth/logout-all');
    setUser(null);
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      if (location.pathname.startsWith('/admin')) {
        navigate('/admin/login');
      } else {
        openLogin(location.pathname);
      }
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [openLogin, navigate, location.pathname]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        ...actions,
        logout,
        logoutAll,
        loginModal,
        openLogin,
        closeLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
