import { createContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { post } from '../api';

const AuthContext = createContext();

export default AuthContext;

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token')); // single time read from localStorage

  function saveAuth(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function register(username, email, password) {
    const { data } = await post('/auth/register', {
      username,
      email,
      password,
    });
    saveAuth(data);
    return data;
  }

  async function login(email, password) {
    const { data } = await post('/auth/login', { email, password });
    saveAuth(data);
    return data;
  }

  async function adminLogin(email, password) {
    const { data } = await post('/admin/login', { email, password });
    saveAuth(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    function handleUnauthorized() {
      const isAdminRoute = location.pathname.startsWith('/admin');
      logout();
      navigate(isAdminRoute ? '/admin/login' : '/login');
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [user, navigate, location.pathname]);

  return (
    <AuthContext.Provider
      value={{ user, token, register, login, adminLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
