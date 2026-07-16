import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { getUserRoles } from '@/services/roles';
import * as authService from '@/services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshRoles = useCallback(async (u) => {
    if (!u) {
      setRoles([]);
      return;
    }
    try {
      setRoles(await getUserRoles(u.id));
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh();
        } catch {
          pb.authStore.clear();
        }
      }
      if (!mounted) return;
      const u = pb.authStore.record;
      setUser(u);
      await refreshRoles(u);
      setLoading(false);
    })();

    const unsub = pb.authStore.onChange((_t, record) => {
      setUser(record);
      refreshRoles(record);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [refreshRoles]);

  const value = {
    user,
    roles,
    loading,
    isAuthenticated: !!user,
    hasRole: (r) => roles.includes(r),
    hasAnyRole: (list) => list.some((r) => roles.includes(r)),
    isAdmin: roles.includes('admin'),
    isCreator: roles.includes('creator'),
    login: async (email, password) => {
      await authService.login(email, password);
      await refreshRoles(pb.authStore.record);
    },
    register: async (data) => {
      await authService.register(data);
      await refreshRoles(pb.authStore.record);
    },
    logout: () => authService.logout(),
    refreshRoles: () => refreshRoles(pb.authStore.record),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
