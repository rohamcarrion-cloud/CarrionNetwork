import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mic, BarChart3, Radio, Sparkles } from 'lucide-react';
import LowPolyBackground from '@/components/LowPolyBackground';
import { Button, Card } from '@/components/kit';
import { SectionHeading, PodcastCard, EpisodeRow } from '@/components/MarketingBits';
import { demoPodcasts, demoEpisodes, demoCreators } from '@/data/demoContent';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[92dvh] overflow-hidden">
        <LowPolyBackground />
        <div className="relative mx-auto flex min-h-[92dvh] max-w-[72rem] flex-col justify-center px-5 py-24 lg:px-8">
          <span className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-mv-border bg-mv-card/60 px-4 py-1.5 text-xs font-medium text-mv-textsec backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-mv-accent2" /> Phase 1 · Platform Foundation
          </span>
          <h1 className="animate-fade-up mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-mv-text sm:text-6xl lg:text-7xl" style={{ animationDelay: '60ms' }}>
            The professional podcast platform for people who build.
          </h1>
          <p className="animate-fade-up mt-6 max-w-xl text-lg text-mv-textsec" style={{ animationDelay: '120ms' }}>
            Business, entrepreneurship, education, technology, AI, finance, leadership, real estate, and career development — all in one engineered home for creators and listeners.
          </p>
          <div className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '180ms' }}>
            <Link to="/discover">
              <Button size="lg" className="w-full sm:w-auto">
                Discover podcasts <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/for-creators">
              <Button size="lg" variant="secondary">Start creating</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured podcasts */}
      <section className="mx-auto max-w-[90rem] px-5 py-20 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading eyebrow="Featured" title="Shows setting the standard" />
          <Link to="/discover" className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-mv-accent2 hover:text-mv-accent md:flex">
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {demoPodcasts.map((p) => <PodcastCard key={p.id} podcast={p} />)}
        </div>
      </section>

      {/* Trending + value */}
      <section className="bg-mv-bg2 py-20">
        <div className="mx-auto grid max-w-[90rem] gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading eyebrow="Trending" title="Episodes moving right now" />
            <div className="mt-8 space-y-1">
              {demoEpisodes.map((e, i) => <EpisodeRow key={e.id} episode={e} index={i} />)}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Built for professionals" title="Everything a modern network needs" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Mic, title: 'Recording studio', desc: 'Capture and edit in the browser.' },
                { icon: Radio, title: 'Distribution', desc: 'Publish everywhere from one place.' },
                { icon: BarChart3, title: 'Analytics', desc: 'Retention insights that matter.' },
                { icon: Sparkles, title: 'Monetization', desc: 'Turn audience into revenue.' },
              ].map((f) => (
                <Card key={f.title} hover>
                  <f.icon className="h-6 w-6 text-mv-accent2" />
                  <h3 className="mt-4 font-display font-semibold text-mv-text">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-mv-muted">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Creator spotlight */}
      <section className="mx-auto max-w-[90rem] px-5 py-20 lg:px-8">
        <SectionHeading eyebrow="Creator spotlight" title="The voices leading the network" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {demoCreators.map((c) => (
            <Card key={c.id} hover className="flex items-center gap-4">
              <div className={`h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br ${c.gradient}`} />
              <div>
                <p className="font-display font-semibold text-mv-text">{c.name}</p>
                <p className="mt-1 text-sm text-mv-muted">{c.tagline}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[72rem] px-5 pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-mv-border bg-mv-card p-10 text-center mv-glow lg:p-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-mv-text sm:text-4xl">
            Ready to publish your first episode?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-mv-textsec">
            Create a free account and grow into a full creator workspace when you are ready.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/signup"><Button size="lg">Create account</Button></Link>
            <Link to="/pricing"><Button size="lg" variant="secondary">See pricing</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
