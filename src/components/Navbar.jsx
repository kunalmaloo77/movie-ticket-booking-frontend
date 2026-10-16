import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import GlobalSearch from './GlobalSearch';
import CitySelectorModal from './CitySelectorModal';
import { setCookie } from '../utils/cookie';
import { capitalize } from '../utils/utils';
import {
  Sun,
  Moon,
  Monitor,
  X,
  User,
  Ticket,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  ChevronRight,
  ChevronDown,
  MapPin,
  Building2,
  Film,
  Clapperboard,
  ListPlus,
  Columns3,
  BarChart3,
} from 'lucide-react';
import { useRegion } from '../hooks/useRegion';

const THEMES = [
  { value: 'light', label: 'Light', icon: <Sun size={14} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
  { value: 'system', label: 'System', icon: <Monitor size={14} /> },
];

const ADMIN_LINKS = [
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  { to: '/admin/regions', label: 'Manage Regions', icon: <MapPin size={16} /> },
  { to: '/admin/cinemas', label: 'Manage Cinemas', icon: <Building2 size={16} /> },
  { to: '/admin/movies', label: 'Manage Movies', icon: <Film size={16} /> },
  { to: '/admin/shows', label: 'Manage Shows', icon: <Clapperboard size={16} /> },
  { to: '/admin/shows/bulk', label: 'Bulk Add Shows', icon: <ListPlus size={16} /> },
  { to: '/admin/screens', label: 'Manage Screens', icon: <Columns3 size={16} /> },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { region } = useRegion();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function handleCitySelect(selectedRegion) {
    setCookie('selected_region', selectedRegion);
    setCityModalOpen(false);
    navigate(`/explore/home/${selectedRegion.city_name}`);
  }

  function handleLogout() {
    logout();
    closeSidebar();
    navigate('/');
  }

  useEffect(() => {
    if (!sidebarOpen) return;
    function onClickOutside(e) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        closeSidebar();
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <>
      <nav className="bg-gray-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link to="/" className="text-lg font-bold shrink-0">
            MovieBook
          </Link>

          {/* Search — fills remaining space */}
          <div className="flex-1 min-w-0">
            <GlobalSearch />
          </div>

          {/* City Change Button */}
          <button
            onClick={() => setCityModalOpen(true)}
            aria-label="Change city"
            title={
              region?.city_name
                ? `Change city (${capitalize(region.city_name)})`
                : 'Select city'
            }
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 transition-colors"
          >
            <MapPin size={15} />
            {region?.city_name && (
              <span className="hidden sm:inline text-xs font-medium max-w-[90px] truncate">
                {capitalize(region.city_name)}
              </span>
            )}
          </button>

          {/* Avatar button */}
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="shrink-0 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            {user ? (
              <span className="text-xs font-bold uppercase">
                {user.username?.[0]}
              </span>
            ) : (
              <User size={15} />
            )}
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        onClick={closeSidebar}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar drawer */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-72 max-w-[calc(100vw-2.5rem)] bg-gray-900 text-white z-50 flex flex-col shadow-2xl transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <span className="font-semibold text-sm text-gray-300">Menu</span>
          <button
            onClick={closeSidebar}
            aria-label="Close menu"
            className="text-gray-400 hover:text-white transition-colors p-1 -mr-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* User badge */}
        {user && (
          <div className="px-5 py-4 border-b border-gray-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                {user.username?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {user ? (
            <>
              <SidebarLink
                to="/my-bookings"
                icon={<Ticket size={16} />}
                onClick={closeSidebar}
              >
                My Bookings
              </SidebarLink>
              {user.role === 'ADMIN' && (
                <div>
                  <button
                    onClick={() => setAdminOpen((o) => !o)}
                    aria-expanded={adminOpen}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
                  >
                    <span className="text-gray-400 group-hover:text-white transition-colors">
                      <LayoutDashboard size={16} />
                    </span>
                    <span className="flex-1 text-left">Admin Section</span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform ${
                        adminOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      adminOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="flex flex-col gap-1 pl-3 pt-1 pb-1">
                      {ADMIN_LINKS.map((l) => (
                        <SidebarLink
                          key={l.to}
                          to={l.to}
                          icon={l.icon}
                          onClick={closeSidebar}
                        >
                          {l.label}
                        </SidebarLink>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <SidebarLink
                to="/login"
                icon={<LogIn size={16} />}
                onClick={closeSidebar}
              >
                Login
              </SidebarLink>
              <SidebarLink
                to="/register"
                icon={<UserPlus size={16} />}
                onClick={closeSidebar}
              >
                Register
              </SidebarLink>
            </>
          )}
        </nav>

        {/* Footer — theme switcher (mobile) + logout */}
        <div className="px-3 pb-6 pt-3 border-t border-gray-700 flex flex-col gap-2 shrink-0">
          {/* Theme switcher visible on mobile inside sidebar */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs text-gray-400 mr-1">Theme</span>
            <div className="flex items-center bg-gray-800 rounded-full p-0.5 gap-0.5">
              {THEMES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  title={label}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                    theme === value
                      ? 'bg-white text-gray-900 font-medium'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      <CitySelectorModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        onSelect={handleCitySelect}
      />
    </>
  );
}

function SidebarLink({ to, icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
    >
      <span className="text-gray-400 group-hover:text-white transition-colors">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRight
        size={14}
        className="text-gray-600 group-hover:text-gray-400 transition-colors"
      />
    </Link>
  );
}
