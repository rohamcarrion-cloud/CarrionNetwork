import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/kit';
import { SectionHeading } from '@/components/MarketingBits';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[72rem] px-5 py-20 lg:px-8">
      <SectionHeading eyebrow="About" title="Building the professional podcast network" description="Carrion Networks exists to give serious creators — and the professionals who follow them — an engineered home for audio that respects their time and expertise." />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-semibold text-mv-text">Our mission</h3>
          <p className="mt-3 text-sm text-mv-textsec">
            We believe the best professional knowledge travels through conversation. Our mission is to make it effortless to create, distribute, and discover that knowledge at a premium standard.
          </p>
        </Card>
        <Card>
          <h3 className="font-display text-lg font-semibold text-mv-text">The team</h3>
          <p className="mt-3 text-sm text-mv-muted">Team profiles are coming soon as the platform grows.</p>
        </Card>
      </div>
      <div className="mt-10"><Link to="/contact"><Button variant="secondary">Get in touch</Button></Link></div>
    </div>
  );
}
