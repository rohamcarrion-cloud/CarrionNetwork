import React from 'react';
import { Construction, Compass, Heart, ListMusic, Clock, LayoutGrid } from 'lucide-react';
import { Card, EmptyState, Button } from '@/components/kit';
import { useAuth } from '@/context/AuthContext';

export const listenerNav = [
  { to: '/app', label: 'Home', icon: 'Home' },
  { to: '/app/discover', label: 'Discover', icon: 'Compass' },
  { to: '/app/library', label: 'Library', icon: 'LibraryBig' },
  { to: '/app/following', label: 'Following', icon: 'Heart' },
  { to: '/app/playlists', label: 'Playlists', icon: 'ListMusic' },
  { to: '/app/history', label: 'History', icon: 'Clock' },
  { to: '/app/notifications', label: 'Notifications', icon: 'Bell' },
  { to: '/app/profile', label: 'Profile', icon: 'User' },
  { to: '/app/settings', label: 'Settings', icon: 'Settings' },
];

export const creatorNav = [
  { to: '/creator', label: 'Overview', icon: 'LayoutGrid' },
  { to: '/creator/podcasts', label: 'Podcasts', icon: 'Mic' },
  { to: '/creator/episodes', label: 'Episodes', icon: 'ListMusic' },
  { to: '/creator/studio', label: 'Recording Studio', icon: 'Radio' },
  { to: '/creator/analytics', label: 'Analytics', icon: 'BarChart3' },
  { to: '/creator/distribution', label: 'Distribution', icon: 'Share2' },
  { to: '/creator/audience', label: 'Audience', icon: 'Users' },
  { to: '/creator/monetization', label: 'Monetization', icon: 'DollarSign' },
  { to: '/creator/team', label: 'Team', icon: 'UserPlus' },
  { to: '/creator/media', label: 'Media Library', icon: 'FolderOpen' },
  { to: '/creator/settings', label: 'Settings', icon: 'Settings' },
  { to: '/creator/billing', label: 'Billing', icon: 'CreditCard' },
];

export const adminNav = [
  { to: '/admin', label: 'Overview', icon: 'LayoutGrid' },
  { to: '/admin/users', label: 'Users', icon: 'Users' },
  { to: '/admin/creators', label: 'Creators', icon: 'Mic' },
  { to: '/admin/podcasts', label: 'Podcasts', icon: 'Radio' },
  { to: '/admin/episodes', label: 'Episodes', icon: 'ListMusic' },
  { to: '/admin/categories', label: 'Categories', icon: 'Tags' },
  { to: '/admin/moderation', label: 'Moderation', icon: 'ShieldAlert' },
  { to: '/admin/reports', label: 'Reports', icon: 'Flag' },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: 'CreditCard' },
  { to: '/admin/payments', label: 'Payments', icon: 'DollarSign' },
  { to: '/admin/support', label: 'Support', icon: 'LifeBuoy' },
  { to: '/admin/analytics', label: 'Platform Analytics', icon: 'BarChart3' },
  { to: '/admin/settings', label: 'System Settings', icon: 'Settings' },
];

export function PlaceholderPage({ title }) {
  return (
    <EmptyState
      icon={Construction}
      title={title || 'Coming soon'}
      description="This area is part of a future phase. The structure and access control are in place; features arrive next."
    />
  );
}

export function ListenerHome() {
  const { user } = useAuth();
  const stats = [
    { label: 'Following', value: 0, icon: Heart },
    { label: 'Playlists', value: 0, icon: ListMusic },
    { label: 'In history', value: 0, icon: Clock },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-mv-text">Welcome, {user?.username || 'listener'}</h1>
        <p className="mt-1 text-mv-muted">Your personalized home. Build your library as you explore.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mv-elevated text-mv-accent2"><s.icon className="h-5 w-5" /></div>
            <div><p className="font-display text-2xl font-bold text-mv-text">{s.value}</p><p className="text-sm text-mv-muted">{s.label}</p></div>
          </Card>
        ))}
      </div>
      <EmptyState icon={Compass} title="Start following shows" description="Head to Discover to find podcasts across business, technology, finance, and more." action={<a href="/discover"><Button>Explore Discover</Button></a>} />
    </div>
  );
}

function RoleOverview({ roleLabel, stats }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-mv-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-mv-text">{s.value}</p>
          </Card>
        ))}
      </div>
      <EmptyState icon={LayoutGrid} title={`${roleLabel} workspace ready`} description="Your shell and permissions are configured. Management tools ship in the next phase." />
    </div>
  );
}

export function CreatorHome() {
  return <RoleOverview roleLabel="Creator" stats={[
    { label: 'Podcasts', value: 0 }, { label: 'Episodes', value: 0 },
    { label: 'Followers', value: 0 }, { label: 'Plays (30d)', value: 0 },
  ]} />;
}

export function AdminHome() {
  return <RoleOverview roleLabel="Admin" stats={[
    { label: 'Total users', value: '—' }, { label: 'Creators', value: '—' },
    { label: 'Podcasts', value: '—' }, { label: 'Open reports', value: '—' },
  ]} />;
}
