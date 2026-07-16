import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/kit';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { to: '/discover', label: 'Discover' },
  { to: '/for-creators', label: 'For Creators' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
];

export default function MarketingLayout() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const dashHref = '/app';

  return (
    <div className="min-h-[100dvh] bg-mv-bg text-mv-text flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-mv-accent focus:px-4 focus:py-2 focus:text-mv-bg">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-mv-divider bg-mv-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-mv-text' : 'text-mv-textsec hover:text-mv-text'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <Button size="sm" onClick={() => navigate(dashHref)}>Dashboard</Button>
            ) : (
              <>
                <Link to="/signin" className="text-sm font-medium text-mv-textsec hover:text-mv-text">
                  Sign in
                </Link>
                <Button size="sm" onClick={() => navigate('/signup')}>Create account</Button>
              </>
            )}
          </div>
          <button
            className="md:hidden text-mv-text p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-mv-divider bg-mv-bg2 px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-sm font-medium ${
                      isActive ? 'bg-mv-elevated text-mv-text' : 'text-mv-textsec'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Button onClick={() => navigate(dashHref)}>Dashboard</Button>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => navigate('/signin')}>Sign in</Button>
                    <Button onClick={() => navigate('/signup')}>Create account</Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-mv-divider bg-mv-bg2">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-5 py-12 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-mv-muted">
              The professional podcast platform for business, technology, finance, and career growth.
            </p>
          </div>
          <FooterCol title="Platform" links={[['Discover', '/discover'], ['For Creators', '/for-creators'], ['Pricing', '/pricing']]} />
          <FooterCol title="Company" links={[['About', '/about'], ['Contact', '/contact']]} />
          <FooterCol title="Account" links={[['Sign in', '/signin'], ['Create account', '/signup']]} />
        </div>
        <div className="border-t border-mv-divider">
          <div className="mx-auto max-w-[90rem] px-5 py-6 text-xs text-mv-muted lg:px-8">
            © {new Date().getFullYear()} Carrion Networks. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-mv-text">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-mv-muted transition-colors hover:text-mv-textsec">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
