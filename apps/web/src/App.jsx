import React from 'react';
import { Route, Routes, Navigate, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import MarketingLayout from '@/layouts/MarketingLayout';
import { ListenerLayout, CreatorLayout, AdminLayout } from '@/layouts/WorkspaceLayouts';

import HomePage from '@/pages/HomePage';
import DiscoverPage from '@/pages/DiscoverPage';
import CategoriesPage from '@/pages/CategoriesPage';
import ForCreatorsPage from '@/pages/ForCreatorsPage';
import PricingPage from '@/pages/PricingPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';

import {
  PlaceholderPage,
  ListenerHome,
  CreatorHome,
  AdminHome,
} from '@/pages/DashboardPages';
import { NotFoundPage, UnauthorizedPage, ServerErrorPage } from '@/pages/ErrorPages';

const P = (title) => <PlaceholderPage title={title} />;

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public marketing routes */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/for-creators" element={<ForCreatorsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Auth (no marketing chrome) */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Listener workspace — any authenticated user */}
          <Route
            element={
              <ProtectedRoute>
                <ListenerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/app" element={<ListenerHome />} />
            <Route path="/app/discover" element={P('Discover')} />
            <Route path="/app/library" element={P('Library')} />
            <Route path="/app/following" element={P('Following')} />
            <Route path="/app/playlists" element={P('Playlists')} />
            <Route path="/app/history" element={P('History')} />
            <Route path="/app/notifications" element={P('Notifications')} />
            <Route path="/app/profile" element={P('Profile')} />
            <Route path="/app/settings" element={P('Settings')} />
          </Route>

          {/* Creator workspace — requires creator role */}
          <Route
            element={
              <ProtectedRoute roles={['creator']}>
                <CreatorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/creator" element={<CreatorHome />} />
            <Route path="/creator/podcasts" element={P('Podcasts')} />
            <Route path="/creator/episodes" element={P('Episodes')} />
            <Route path="/creator/studio" element={P('Recording Studio')} />
            <Route path="/creator/analytics" element={P('Analytics')} />
            <Route path="/creator/distribution" element={P('Distribution')} />
            <Route path="/creator/audience" element={P('Audience')} />
            <Route path="/creator/monetization" element={P('Monetization')} />
            <Route path="/creator/team" element={P('Team')} />
            <Route path="/creator/media" element={P('Media Library')} />
            <Route path="/creator/settings" element={P('Creator Settings')} />
            <Route path="/creator/billing" element={P('Billing')} />
          </Route>

          {/* Admin workspace — requires admin role */}
          <Route
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/users" element={P('Users')} />
            <Route path="/admin/creators" element={P('Creators')} />
            <Route path="/admin/podcasts" element={P('Podcasts')} />
            <Route path="/admin/episodes" element={P('Episodes')} />
            <Route path="/admin/categories" element={P('Categories')} />
            <Route path="/admin/moderation" element={P('Moderation')} />
            <Route path="/admin/reports" element={P('Reports')} />
            <Route path="/admin/subscriptions" element={P('Subscriptions')} />
            <Route path="/admin/payments" element={P('Payments')} />
            <Route path="/admin/support" element={P('Support')} />
            <Route path="/admin/analytics" element={P('Platform Analytics')} />
            <Route path="/admin/settings" element={P('System Settings')} />
          </Route>

          {/* Error routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/server-error" element={<ServerErrorPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" theme="dark" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
