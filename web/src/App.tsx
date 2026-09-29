import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { AuthPage } from './auth/AuthPage';
import { MediaLibrary } from './features/Media';
import { Shell } from './components/Shell';
import { ActionLink, EmptyState, ErrorNotice, Loading } from './components/ui';
import { Dashboard } from './features/Dashboard';
import { NewShow, ShowDetail, Shows } from './features/Shows';
import { EpisodeEditor, Episodes } from './features/Episodes';
import {
  FutureModule,
  Settings,
  futureModules,
} from './features/WorkspacePages';

function Protected() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'loading')
    return <Loading label="Restoring your session…" />;
  if (auth.status === 'error')
    return (
      <main className="restore-error">
        <h1>Let’s reconnect your studio</h1>
        <ErrorNotice message={auth.error} retry={auth.retry} />
      </main>
    );
  if (auth.status !== 'authenticated')
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  return <Outlet />;
}
export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/sign-in" element={<AuthPage key="signin" />} />
        <Route path="/sign-up" element={<AuthPage key="signup" signup />} />
        <Route element={<Protected />}>
          <Route element={<Shell />}>
            <Route index element={<Dashboard />} />
            <Route path="shows" element={<Shows />} />
            <Route path="shows/new" element={<NewShow />} />
            <Route path="shows/:id" element={<ShowDetail />} />
            <Route path="episodes" element={<Episodes />} />
            <Route
              path="shows/:showId/episodes/new"
              element={<EpisodeEditor key="new" create />}
            />
            <Route
              path="shows/:showId/episodes/:episodeId"
              element={<EpisodeEditor key="edit" />}
            />
            {(Object.keys(futureModules) as (keyof typeof futureModules)[]).map(
              (module) => (
                <Route
                  key={module}
                  path={module}
                  element={<FutureModule module={module} />}
                />
              ),
            )}
            <Route path="media" element={<MediaLibrary />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="*"
              element={
                <EmptyState
                  title="This page is off the map"
                  action={<ActionLink to="/">Back to dashboard</ActionLink>}
                >
                  Use your workspace navigation to find your next step.
                </EmptyState>
              }
            />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
