import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import GlobalSearch from './GlobalSearch';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEMES = [
  { value: 'light', label: 'Light', icon: <Sun size={13} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={13} /> },
  { value: 'system', label: 'System', icon: <Monitor size={13} /> },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-lg font-bold">
        MovieBook
      </Link>
      <GlobalSearch />
      <div className="flex items-center gap-4 text-sm">
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
    </nav>
  );
}
