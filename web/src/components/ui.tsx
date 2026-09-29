import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Radio, ArrowRight } from 'lucide-react';

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Carrion Network home">
      <span className="brand-mark">
        <Radio size={24} />
      </span>
      <span>
        CARRION<span className="brand-sub">NETWORK / CREATOR STUDIO</span>
      </span>
    </Link>
  );
}
export function Loading({
  label = 'Loading your studio…',
}: {
  label?: string;
}) {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      {label}
    </div>
  );
}
export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="notice error" role="alert">
      <span>{message}</span>
      {retry && (
        <button type="button" className="button secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty panel">
      <span className="empty-icon">
        <Radio size={30} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function PageHeader({
  eyebrow = 'CREATOR STUDIO',
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function ActionLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="button" to={to}>
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ error: error.message, loading: false });
      });
    return () => controller.abort();
  }, [load, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
