import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { listenerNav, creatorNav, adminNav } from '@/pages/DashboardPages';

export function ListenerLayout() {
  return <DashboardLayout nav={listenerNav} />;
}

export function CreatorLayout() {
  return <DashboardLayout nav={creatorNav} />;
}

export function AdminLayout() {
  return <DashboardLayout nav={adminNav} />;
}
