import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import LowPolyBackground from '@/components/LowPolyBackground';
import Logo from '@/components/Logo';
import { Button, Field, Input } from '@/components/kit';
import { useAuth } from '@/context/AuthContext';
import { resetPassword } from '@/services/auth';

export default function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back');
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setError(err?.status === 400 ? 'Invalid email or password.' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email) return toast.error('Enter your email first');
    try {
      await resetPassword(email);
      toast.success('Password reset email sent');
    } catch {
      toast.error('Could not send reset email');
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-mv-bg px-5 py-12">
      <LowPolyBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-mv-border bg-mv-card/80 p-8 backdrop-blur-xl">
          <h1 className="font-display text-2xl font-bold text-mv-text">Sign in</h1>
          <p className="mt-1 text-sm text-mv-muted">Welcome back to Carrion Networks.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</div>}
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </Field>
            <button type="button" onClick={forgot} className="text-xs font-medium text-mv-accent2 hover:text-mv-accent">Forgot password?</button>
            <Button type="submit" className="w-full" loading={loading}>Sign in</Button>
          </form>
          <p className="mt-6 text-center text-sm text-mv-muted">
            No account? <Link to="/signup" className="font-medium text-mv-accent2 hover:text-mv-accent">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
