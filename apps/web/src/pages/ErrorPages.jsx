import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Compass, ServerCrash } from 'lucide-react';
import LowPolyBackground from '@/components/LowPolyBackground';
import { Button } from '@/components/kit';

function Shell({ icon: Icon, code, title, desc, to, cta }) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-mv-bg px-5">
      <LowPolyBackground />
      <div className="relative text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-mv-elevated text-mv-accent2"><Icon className="h-8 w-8" /></div>
        {code && <p className="font-display text-6xl font-bold text-mv-accent2">{code}</p>}
        <h1 className="mt-3 font-display text-2xl font-bold text-mv-text">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-mv-muted">{desc}</p>
        <Link to={to} className="mt-8 inline-block"><Button>{cta}</Button></Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return <Shell icon={Compass} code="404" title="Page not found" desc="The page you are looking for does not exist or has moved." to="/" cta="Back to home" />;
}

export function UnauthorizedPage() {
  return <Shell icon={ShieldX} title="Access denied" desc="You do not have permission to view this page. Contact an administrator if you believe this is a mistake." to="/app" cta="Go to dashboard" />;
}

export function ServerErrorPage() {
  return <Shell icon={ServerCrash} code="500" title="Something went wrong" desc="An unexpected error occurred on our end. Please try again in a moment." to="/" cta="Back to home" />;
}
