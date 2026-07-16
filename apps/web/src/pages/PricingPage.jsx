import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button, Card } from '@/components/kit';
import { SectionHeading } from '@/components/MarketingBits';

const tiers = [
  { name: 'Free', price: 0, tagline: 'For listeners exploring the network.', cta: 'Create account', highlight: false,
    features: ['Unlimited listening', 'Follow shows', 'Create playlists', 'Listening history'] },
  { name: 'Creator', price: 12, tagline: 'For creators launching their first shows.', cta: 'Start creating', highlight: true,
    features: ['Everything in Free', 'Publish podcasts', 'Recording studio', 'Basic analytics', 'Distribution'] },
  { name: 'Pro', price: 29, tagline: 'For professional networks and teams.', cta: 'Go Pro', highlight: false,
    features: ['Everything in Creator', 'Advanced analytics', 'Team collaboration', 'Monetization', 'Priority support'] },
];

const faqs = [
  ['Can I switch plans later?', 'Yes. Upgrade or downgrade at any time — changes apply to your next billing cycle.'],
  ['Is there a free option?', 'The Free plan lets any listener explore the full catalog and build playlists at no cost.'],
  ['Do you take a cut of monetization?', 'Pro creators keep the majority of revenue; detailed terms ship in a later phase.'],
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-[90rem] px-5 py-16 lg:px-8">
      <SectionHeading className="mx-auto text-center" eyebrow="Pricing" title="Simple plans that grow with you" description="Start free as a listener. Upgrade when you are ready to create and monetize." />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.name} className={t.highlight ? 'border-mv-accent mv-glow' : ''}>
            {t.highlight && <span className="mb-4 inline-block rounded-full bg-mv-accent px-3 py-1 text-xs font-semibold text-mv-bg">Most popular</span>}
            <h3 className="font-display text-xl font-bold text-mv-text">{t.name}</h3>
            <p className="mt-1 text-sm text-mv-muted">{t.tagline}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-mv-text">${t.price}</span>
              <span className="text-sm text-mv-muted">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-mv-textsec">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mv-accent2" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="mt-8 block">
              <Button className="w-full" variant={t.highlight ? 'primary' : 'secondary'}>{t.cta}</Button>
            </Link>
          </Card>
        ))}
      </div>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold text-mv-text">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-mv-divider rounded-2xl border border-mv-border bg-mv-card">
          {faqs.map(([q, a]) => (
            <div key={q} className="p-6">
              <p className="font-medium text-mv-text">{q}</p>
              <p className="mt-2 text-sm text-mv-muted">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
