import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { post } from '../api';
import AuthContext from './authContextObject';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token')); // single time read from localStorage
  // null = closed; otherwise { from } — the path to return to after login
  const [loginModal, setLoginModal] = useState(null);

  const saveAuth = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const openLogin = useCallback((from) => {
    setLoginModal({ from: from ?? null });
  }, []);

  const closeLogin = useCallback(() => setLoginModal(null), []);

  async function startPasswordLogin(email, password) {
    await post('/auth/password/start', { email, password });
  }

  async function sendEmailCode(email) {
    await post('/auth/email/send-code', { email });
  }

  async function verifyEmailCode(email, code) {
    const { data } = await post('/auth/email/verify-code', { email, code });
    saveAuth(data);
    return data;
  }

  async function googleLogin(credential) {
    const { data } = await post('/auth/google', { credential });
    saveAuth(data);
    return data;
  }

  async function adminLogin(email, password) {
    const { data } = await post('/admin/login', { email, password });
    saveAuth(data);
    return data;
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      logout();
      if (location.pathname.startsWith('/admin')) {
        navigate('/admin/login');
      } else {
        openLogin(location.pathname);
      }
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, openLogin, navigate, location.pathname]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        startPasswordLogin,
        sendEmailCode,
        verifyEmailCode,
        googleLogin,
        adminLogin,
        logout,
        saveAuth,
        loginModal,
        openLogin,
        closeLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
