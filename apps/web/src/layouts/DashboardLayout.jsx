import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import Logo from '@/components/Logo';
import { getIcon } from '@/lib/icons';
import { useAuth } from '@/context/AuthContext';

const WORKSPACES = [
  { role: null, to: '/app', label: 'Listener' },
  { role: 'creator', to: '/creator', label: 'Creator' },
  { role: 'admin', to: '/admin', label: 'Admin' },
];

export default function DashboardLayout({ title, nav }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const workspaces = WORKSPACES.filter((w) => !w.role || hasRole(w.role));
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);

  const doLogout = () => {
    logout();
    navigate('/');
  };

  const NavItems = ({ onClick }) => (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {nav.map((item) => {
        const Icon = getIcon(item.icon);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-mv-accent text-mv-bg' : 'text-mv-textsec hover:bg-mv-elevated hover:text-mv-text'
              }`
            }
          >
            <Icon className="h-4 w-4" /> {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-mv-bg text-mv-text">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-mv-divider bg-mv-bg/85 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-mv-text" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <Logo to="/app" />
          </div>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mv-muted" />
            <input disabled placeholder="Search (coming soon)" className="h-10 w-full rounded-xl border border-mv-border bg-mv-bg2 pl-10 pr-4 text-sm text-mv-text placeholder:text-mv-muted" />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative rounded-xl p-2.5 text-mv-textsec hover:bg-mv-elevated" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-mv-elevated" aria-label="User menu">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-mv-accent to-[#4c3fb0] text-sm font-semibold text-mv-bg">
                  {(user?.username || user?.email || '?').charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-mv-muted sm:block" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-mv-border bg-mv-elevated shadow-xl" onMouseLeave={() => setMenu(false)}>
                  <div className="border-b border-mv-divider px-4 py-3">
                    <p className="truncate text-sm font-medium text-mv-text">{user?.username || 'Member'}</p>
                    <p className="truncate text-xs text-mv-muted">{user?.email}</p>
                  </div>
                  {workspaces.length > 1 && (
                    <div className="border-b border-mv-divider py-1">
                      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-mv-muted">Workspaces</p>
                      {workspaces.map((w) => (
                        <MenuBtn key={w.to} icon={Settings} label={w.label} onClick={() => { navigate(w.to); setMenu(false); }} />
                      ))}
                    </div>
                  )}
                  <MenuBtn icon={User} label="Profile" onClick={() => { navigate('/app/profile'); setMenu(false); }} />
                  <MenuBtn icon={Settings} label="Settings" onClick={() => { navigate('/app/settings'); setMenu(false); }} />
                  <MenuBtn icon={LogOut} label="Log out" onClick={doLogout} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem]">
        {/* Sidebar desktop */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 border-r border-mv-divider p-4 lg:block">
          <NavItems />
        </aside>

        {/* Drawer mobile */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] border-r border-mv-divider bg-mv-bg2 p-4">
              <div className="mb-6 flex items-center justify-between">
                <Logo to="/app" />
                <button onClick={() => setDrawer(false)} aria-label="Close menu"><X className="h-5 w-5 text-mv-text" /></button>
              </div>
              <NavItems onClick={() => setDrawer(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-5 pb-28 lg:p-8">
          {title && <h1 className="mb-6 font-display text-2xl font-bold text-mv-text">{title}</h1>}
          <Outlet />
        </main>
      </div>

      {/* Persistent player */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-mv-divider bg-mv-bg2/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[100rem] items-center gap-4 px-4 lg:px-8">
          <div className="h-10 w-10 rounded-lg bg-mv-elevated" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-mv-textsec">Nothing playing</p>
            <p className="truncate text-xs text-mv-muted">Audio playback arrives in a later phase.</p>
          </div>
          <div className="hidden h-1 w-40 rounded-full bg-mv-elevated sm:block"><div className="h-1 w-0 rounded-full bg-mv-accent" /></div>
        </div>
      </div>
    </div>
  );
}

function MenuBtn({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-mv-textsec transition-colors hover:bg-mv-card hover:text-mv-text">
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
