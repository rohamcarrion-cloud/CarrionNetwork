import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, BarChart3, Radio, DollarSign, Server, Users } from 'lucide-react';
import LowPolyBackground from '@/components/LowPolyBackground';
import { Button, Card } from '@/components/kit';
import { SectionHeading } from '@/components/MarketingBits';
import { demoTestimonials } from '@/data/demoContent';

const features = [
  { icon: Server, title: 'Podcast hosting', desc: 'Reliable, unlimited hosting engineered for scale.' },
  { icon: Mic, title: 'Recording studio', desc: 'Record and edit remote conversations in the browser.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Retention curves, audience geography, and growth trends.' },
  { icon: Radio, title: 'Distribution', desc: 'Push to Apple, Spotify, and every major directory.' },
  { icon: DollarSign, title: 'Monetization', desc: 'Subscriptions, sponsorships, and premium episodes.' },
  { icon: Users, title: 'Team collaboration', desc: 'Invite editors and guests with scoped permissions.' },
];

export default function ForCreatorsPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <LowPolyBackground />
        <div className="relative mx-auto max-w-[72rem] px-5 py-24 lg:px-8">
          <SectionHeading
            eyebrow="For creators"
            title="Everything you need to build a serious show"
            description="Carrion gives professional creators the studio, distribution, and insight to turn expertise into an audience — without stitching together five tools."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup"><Button size="lg">Start creating</Button></Link>
            <Link to="/pricing"><Button size="lg" variant="secondary">Compare plans</Button></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-5 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} hover>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mv-elevated text-mv-accent2">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-mv-text">{f.title}</h3>
              <p className="mt-2 text-sm text-mv-muted">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-mv-bg2 py-20">
        <div className="mx-auto max-w-[90rem] px-5 lg:px-8">
          <SectionHeading eyebrow="Loved by creators" title="What hosts are saying" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {demoTestimonials.map((t) => (
              <Card key={t.name}>
                <p className="text-mv-textsec">“{t.quote}”</p>
                <div className="mt-6">
                  <p className="font-display font-semibold text-mv-text">{t.name}</p>
                  <p className="text-sm text-mv-muted">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[72rem] px-5 py-24 text-center lg:px-8">
        <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold text-mv-text">Launch your network on Carrion</h2>
        <div className="mt-8"><Link to="/signup"><Button size="lg">Start creating</Button></Link></div>
      </section>
    </div>
  );
}
