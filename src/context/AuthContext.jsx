import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
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
    const data = await post('/auth/register', { username, email, password });
    saveAuth(data);
    return data;
  }

  async function login(email, password) {
    const data = await post('/auth/login', { email, password });
    saveAuth(data);
    return data;
  }

  async function adminLogin(email, password) {
    const data = await post('/admin/login', { email, password });
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
      logout();
      navigate(user?.role === 'ADMIN' ? '/admin/login' : '/login');
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, token, register, login, adminLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
