import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from './AuthProvider';
import { Brand, ErrorNotice, Loading } from '../components/ui';

export function AuthPage({ signup = false }: { signup?: boolean }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const from =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/') &&
    !location.state.from.startsWith('//')
      ? location.state.from
      : '/';
  if (auth.status === 'loading')
    return <Loading label="Restoring your session…" />;
  if (auth.status === 'error')
    return (
      <div className="auth-page">
        <ErrorNotice message={auth.error} retry={auth.retry} />
      </div>
    );
  if (auth.status === 'authenticated') return <Navigate to={from} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: String(form.get('email')),
      password: String(form.get('password')),
    };
    try {
      if (signup) {
        await auth.register({
          ...credentials,
          display_name: String(form.get('display_name')),
        });
        navigate('/sign-in', {
          replace: true,
          state: { registered: true, from },
        });
      } else await auth.login(credentials);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Brand />
      <div className="auth-grid">
        <section className="auth-story">
          <p className="eyebrow">YOUR VOICE. YOUR NETWORK.</p>
          <h1>
            Great conversations
            <br />
            <span>start here.</span>
          </h1>
          <p>
            A dedicated home for your shows, your stories, and what comes next.
          </p>
          <div className="wave" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} style={{ height: `${20 + ((i * 37) % 90)}px` }} />
            ))}
          </div>
          <p className="muted">Carrion Network · Creator Studio</p>
        </section>
        <section className="auth-card panel">
          <p className="eyebrow">WELCOME TO THE STUDIO</p>
          <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>
          <p>
            {signup
              ? 'Make space for your next great idea.'
              : 'Sign in to pick up where you left off.'}
          </p>
          {location.state?.registered && (
            <p className="notice success" role="status">
              Account created. Sign in to enter your studio.
            </p>
          )}
          {error && <ErrorNotice message={error} />}
          <form onSubmit={submit}>
            {signup && (
              <label>
                Display name
                <input
                  name="display_name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  pattern=".*\S.*"
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                required
                minLength={signup ? 12 : undefined}
                maxLength={256}
              />
            </label>
            {signup && <small>Use 12–256 characters.</small>}
            <button className="button full" disabled={busy}>
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already have an account?' : 'New to Carrion Network?'}{' '}
            <Link to={signup ? '/sign-in' : '/sign-up'} state={{ from }}>
              {signup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
