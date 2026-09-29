import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createApi, type Api } from '../api/client';
import type { Credentials, User } from '../api/types';

const STORAGE_KEY = 'carrion.session';
function readToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function persist(token: string | null) {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Private browser storage can be unavailable; the in-memory session still works. */
  }
}
type Status = 'loading' | 'authenticated' | 'anonymous' | 'error';
interface AuthState {
  api: Api;
  user: User | null;
  status: Status;
  error: string;
  retry: () => void;
  login: (credentials: Credentials) => Promise<void>;
  register: (
    credentials: Credentials & { display_name: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'anonymous');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const expire = useCallback(() => {
    persist(null);
    setToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);
  const api = useMemo(() => createApi(token, expire), [token, expire]);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    api
      .me(controller.signal)
      .then(({ user }) => {
        if (!controller.signal.aborted) {
          setUser(user);
          setStatus('authenticated');
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.status !== 401) {
          setError(error.message);
          setStatus('error');
        }
      });
    return () => controller.abort();
  }, [token, api, attempt]);
  async function login(credentials: Credentials) {
    const session = await api.login(credentials);
    persist(session.token);
    setUser(session.user);
    setToken(session.token);
    setStatus('authenticated');
  }
  async function register(credentials: Credentials & { display_name: string }) {
    await api.register(credentials);
    // Registration does not create a session. Keep login explicit so a failed login
    // never makes the UI misleadingly retry an already successful registration.
  }
  async function logout() {
    await api.logout();
    expire();
  }
  return (
    <Context.Provider
      value={{
        api,
        user,
        status,
        error,
        retry: () => setAttempt((value) => value + 1),
        login,
        register,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
