// src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { getToken, getAdmin } from '../lib/auth';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  requiredRole?: string;
}

export default function PrivateRoute({ children, requiredRole }: Props) {
  const { admin: storeAdmin } = useAuthStore();
  const token = getToken();
  const admin = storeAdmin || getAdmin();

  if (!token || !admin) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && admin.adminRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
