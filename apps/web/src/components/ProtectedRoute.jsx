import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

function FullScreenLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-mv-bg">
      <Loader2 className="w-8 h-8 text-mv-accent animate-spin" />
    </div>
  );
}

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, hasAnyRole } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
