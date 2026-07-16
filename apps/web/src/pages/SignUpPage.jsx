import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LowPolyBackground from '@/components/LowPolyBackground';
import Logo from '@/components/Logo';
import { Button, Field, Input } from '@/components/kit';
import { useAuth } from '@/context/AuthContext';

export default function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '', terms: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (form.username.length < 3) e.username = 'Username must be at least 3 characters.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    if (!form.terms) e.terms = 'You must accept the terms.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, username: form.username });
      toast.success('Account created', { description: 'You are signed in.' });
      navigate('/app', { replace: true });
    } catch (err) {
      const data = err?.response?.data || {};
      const next = {};
      if (data.email) next.email = 'This email is already registered.';
      if (data.username) next.username = 'This username is already taken.';
      if (data.password) next.password = 'Password does not meet requirements.';
      if (!Object.keys(next).length) next.email = 'Registration failed. Please try again.';
      setErrors(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-mv-bg px-5 py-12">
      <LowPolyBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-mv-border bg-mv-card/80 p-8 backdrop-blur-xl">
          <h1 className="font-display text-2xl font-bold text-mv-text">Create your account</h1>
          <p className="mt-1 text-sm text-mv-muted">Join as a listener — upgrade to creator anytime.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </Field>
            <Field label="Username" htmlFor="username" error={errors.username}>
              <Input id="username" value={form.username} onChange={set('username')} autoComplete="username" />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
              <Input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
            </Field>
            <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
              <Input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </Field>
            <label className="flex items-start gap-2.5 text-sm text-mv-textsec">
              <input type="checkbox" checked={form.terms} onChange={set('terms')} className="mt-0.5 h-4 w-4 rounded border-mv-border bg-mv-bg2 accent-mv-accent" />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>
            {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
            <Button type="submit" className="w-full" loading={loading}>Create account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-mv-muted">
            Already have an account? <Link to="/signin" className="font-medium text-mv-accent2 hover:text-mv-accent">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
