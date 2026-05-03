import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import GlobalSearch from './GlobalSearch';
import { Sun, Moon, Monitor, Menu, X } from 'lucide-react';

const THEMES = [
  { value: 'light', label: 'Light', icon: <Sun size={13} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={13} /> },
  { value: 'system', label: 'System', icon: <Monitor size={13} /> },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="bg-gray-900 text-white px-4 sm:px-6">
      <div className="flex items-center justify-between py-3">
        <Link to="/" className="text-lg font-bold shrink-0">
          MovieBook
        </Link>

        <div className="flex-1 mx-3 sm:mx-6">
          <GlobalSearch />
        </div>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <div className="flex items-center bg-gray-800 rounded-full p-0.5 gap-0.5">
            {THEMES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={label}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  theme === value
                    ? 'bg-white text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {user ? (
            <>
              <Link to="/my-bookings" className="hover:underline">
                My Bookings
              </Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
              <span>Hi {user.username}</span>
              <button onClick={logout} className="hover:underline cursor-pointer">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link to="/register" className="hover:underline">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="sm:hidden p-1 text-gray-400 hover:text-white"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-700 pb-3 pt-2 flex flex-col gap-3 text-sm">
          <div className="flex items-center bg-gray-800 rounded-full p-0.5 gap-0.5 self-start">
            {THEMES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={label}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  theme === value
                    ? 'bg-white text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          {user ? (
            <>
              <Link to="/my-bookings" onClick={closeMenu} className="hover:underline">
                My Bookings
              </Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin" onClick={closeMenu} className="hover:underline">
                  Admin
                </Link>
              )}
              <span>Hi {user.username}</span>
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="hover:underline cursor-pointer text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="hover:underline">
                Login
              </Link>
              <Link to="/register" onClick={closeMenu} className="hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
