import React from 'react';

// Sophisticated, engineered low-poly facet field rendered as SVG polygons
// in charcoal / graphite / slate tones with soft ambient violet lighting.
export default function LowPolyBackground({ className = '' }) {
  const facets = [
    { p: '0,0 220,60 120,260 0,220', f: '#14131f' },
    { p: '220,60 480,0 420,220 120,260', f: '#1a1826' },
    { p: '480,0 760,80 640,240 420,220', f: '#12111c' },
    { p: '760,80 1000,0 1000,200 640,240', f: '#1c1a2b' },
    { p: '0,220 120,260 80,520 0,480', f: '#181722' },
    { p: '120,260 420,220 480,480 80,520', f: '#201e30' },
    { p: '420,220 640,240 720,500 480,480', f: '#16151f' },
    { p: '640,240 1000,200 1000,460 720,500', f: '#1b1929' },
    { p: '0,480 80,520 160,760 0,720', f: '#131220' },
    { p: '80,520 480,480 520,760 160,760', f: '#1d1b2c' },
    { p: '480,480 720,500 800,760 520,760', f: '#17161f' },
    { p: '720,500 1000,460 1000,720 800,760', f: '#211f33' },
  ];
  return (
    <div className={`lowpoly-bg ${className}`} aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.85]"
        viewBox="0 0 1000 760"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="lp-glow" cx="25%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#8B7CF6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#8B7CF6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {facets.map((fc, i) => (
          <polygon
            key={i}
            points={fc.p}
            fill={fc.f}
            stroke="#2C2744"
            strokeWidth="1"
          />
        ))}
        <rect width="1000" height="760" fill="url(#lp-glow)" />
      </svg>
    </div>
  );
}
