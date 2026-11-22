import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_LINKS } from './adminLinks';

function sidebarLinkClass({ isActive }) {
  return `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
    isActive
      ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-500/10 dark:text-brand-400'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
  }`;
}

function tabLinkClass({ isActive }) {
  return `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
    isActive
      ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-500/10 dark:text-brand-400'
      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
  }`;
}

export default function AdminLayout() {
  const tabsRef = useRef(null);
  const { pathname } = useLocation();

  // Keep the active tab visible in the mobile tab strip.
  useEffect(() => {
    const active = tabsRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

  return (
    <div className="lg:flex">
      {/* Desktop: always-visible sidebar */}
      {/* top-14 = navbar height */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <p className="px-6 pt-6 pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Admin
        </p>
        <nav className="flex flex-col gap-1 px-3 pb-6">
          {ADMIN_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={sidebarLinkClass}
            >
              <link.icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile / tablet: always-visible scrollable tab strip */}
      <nav
        ref={tabsRef}
        className="lg:hidden sticky top-14 z-20 flex gap-2 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2"
      >
        {ADMIN_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={tabLinkClass}
          >
            <link.icon size={14} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
