import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { Input, Badge, Card } from '@/components/kit';
import { SectionHeading, PodcastCard, EpisodeRow } from '@/components/MarketingBits';
import { demoPodcasts, demoEpisodes, demoCategories } from '@/data/demoContent';

export default function DiscoverPage() {
  const [active, setActive] = useState('All');
  const filters = ['All', ...demoCategories.map((c) => c.name)];
  const shown = active === 'All' ? demoPodcasts : demoPodcasts.filter((p) => p.category === active);

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-14 lg:px-8">
      <SectionHeading eyebrow="Discover" title="Find your next essential listen" description="Explore professional shows across the topics that move careers and companies forward." />

      <div className="relative mt-8 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mv-muted" />
        <Input placeholder="Search shows, episodes, creators (coming soon)" className="pl-11" disabled aria-label="Search" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              active === f ? 'border-mv-accent bg-mv-accent text-mv-bg' : 'border-mv-border text-mv-textsec hover:border-mv-accent/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="mt-14">
        <h2 className="font-display text-xl font-bold text-mv-text">Featured podcasts</h2>
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {shown.map((p) => <PodcastCard key={p.id} podcast={p} />)}
        </div>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-bold text-mv-text">Trending episodes</h2>
          <div className="mt-6 space-y-1">
            {demoEpisodes.map((e, i) => <EpisodeRow key={e.id} episode={e} index={i} />)}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-mv-text">Browse by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {demoCategories.map((c) => {
              const Icon = getIcon(c.icon, 'Hash');
              return (
                <Card key={c.slug} hover className="p-4">
                  <Icon className="h-6 w-6 text-mv-accent2" />
                  <p className="mt-3 font-medium text-mv-text">{c.name}</p>
                  <p className="text-xs text-mv-muted">{c.count} shows</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-bold text-mv-text">New releases</h2>
          <Badge>Updated weekly</Badge>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {[...demoPodcasts].reverse().map((p) => <PodcastCard key={`nr-${p.id}`} podcast={p} />)}
        </div>
      </section>
    </div>
  );
}
