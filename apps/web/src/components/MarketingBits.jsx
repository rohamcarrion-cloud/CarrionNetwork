import React from 'react';
import { Play, Headphones } from 'lucide-react';

export function SectionHeading({ eyebrow, title, description, className = '' }) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-mv-accent2">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-mv-text sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-3 text-mv-textsec">{description}</p>}
    </div>
  );
}

export function PodcastCard({ podcast }) {
  return (
    <div className="group cursor-pointer">
      <div className={`relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${podcast.gradient} border border-mv-border`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Headphones className="h-10 w-10 text-white/25" />
        </div>
        <div className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-mv-bg/70 text-mv-text opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-0.5 backdrop-blur">
          <Play className="h-4 w-4 fill-current" />
        </div>
      </div>
      <div className="mt-3">
        <p className="truncate font-display font-semibold text-mv-text">{podcast.title}</p>
        <p className="truncate text-sm text-mv-muted">{podcast.host} · {podcast.category}</p>
      </div>
    </div>
  );
}

export function EpisodeRow({ episode, index }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-mv-border hover:bg-mv-card">
      <span className="w-6 text-center font-mono text-sm text-mv-muted">{index + 1}</span>
      <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mv-elevated text-mv-accent2 transition-colors hover:bg-mv-accent hover:text-mv-bg" aria-label="Play episode">
        <Play className="h-4 w-4 fill-current" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-mv-text">{episode.title}</p>
        <p className="truncate text-sm text-mv-muted">{episode.show}</p>
      </div>
      <span className="hidden text-sm text-mv-muted sm:block">{episode.plays} plays</span>
      <span className="text-sm text-mv-muted">{episode.duration}</span>
    </div>
  );
}
