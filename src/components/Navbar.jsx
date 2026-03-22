import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-lg font-bold">
        MovieBook
      </Link>
      <GlobalSearch />
      <div className="flex items-center gap-4 text-sm">
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
