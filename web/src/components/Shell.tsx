import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Radio,
  Mic2,
  Library,
  Share2,
  ChartNoAxesCombined,
  Users,
  CircleDollarSign,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Brand, ErrorNotice } from './ui';

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/shows', label: 'Shows', icon: Radio },
  { to: '/episodes', label: 'Episodes', icon: Mic2 },
  { to: '/media', label: 'Media Library', icon: Library },
  { to: '/distribution', label: 'Distribution', icon: Share2 },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/audience', label: 'Audience', icon: Users },
  { to: '/monetization', label: 'Monetization', icon: CircleDollarSign },
  { to: '/settings', label: 'Settings', icon: Settings },
];
export function Shell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, location.search]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  async function signOut() {
    setBusy(true);
    setError('');
    try {
      await logout();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="studio">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="mobile-bar">
        <Brand />
        <button
          className="icon-button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="studio-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      <aside
        id="studio-navigation"
        className={`sidebar ${open ? 'is-open' : ''}`}
      >
        <div className="desktop-brand">
          <Brand />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Creator navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <span className="status-dot" />
            Your creative home<p>One idea. A world of possibilities.</p>
          </div>
          <div className="profile">
            <span className="avatar">
              {user?.display_name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user?.display_name}</strong>
              <small>Creator account</small>
            </div>
          </div>
          <button className="signout" onClick={signOut} disabled={busy}>
            <LogOut size={17} />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
          {error && <ErrorNotice message={`Sign out failed. ${error}`} />}
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>
            Workspace <span className="slash">/</span>{' '}
            {navigation.find((item) => item.to === location.pathname)?.label ||
              'Draft editor'}
          </span>
          <span className="badge">CREATOR STUDIO</span>
        </div>
        <main id="main" tabIndex={-1} ref={mainRef}>
          <Outlet />
        </main>
        <footer>
          Built for voices that matter.<span>CARRION NETWORK</span>
        </footer>
      </div>
    </div>
  );
}
