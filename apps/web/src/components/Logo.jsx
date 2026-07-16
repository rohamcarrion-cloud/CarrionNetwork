import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-mv-accent to-[#4c3fb0]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-mv-bg" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 3 4 7v6c0 4 3.4 6.6 8 8 4.6-1.4 8-4 8-8V7l-8-4Z" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-mv-text">
        Carrion<span className="text-mv-accent2"> Networks</span>
      </span>
    </Link>
  );
}
