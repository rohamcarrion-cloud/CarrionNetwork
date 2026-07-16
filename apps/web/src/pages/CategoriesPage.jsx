import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/kit';
import { SectionHeading } from '@/components/MarketingBits';
import { getIcon } from '@/lib/icons';
import { demoCategories } from '@/data/demoContent';

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-[90rem] px-5 py-14 lg:px-8">
      <SectionHeading
        eyebrow="Browse"
        title="Explore every category"
        description="Professional podcasts across the topics that move careers and companies forward."
      />
      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {demoCategories.map((c) => {
          const Icon = getIcon(c.icon, 'Hash');
          return (
            <Link key={c.slug} to="/discover">
              <Card hover className="h-full">
                <Icon className="h-7 w-7 text-mv-accent2" />
                <p className="mt-4 font-display font-semibold text-mv-text">{c.name}</p>
                <p className="mt-1 text-sm text-mv-muted">{c.count} shows</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
