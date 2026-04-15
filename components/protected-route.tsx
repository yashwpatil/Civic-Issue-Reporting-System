'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin' | 'department';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setRedirectTarget('/login');
      return;
    }

    if (requiredRole && user?.type !== requiredRole) {
      if (user?.type === 'admin') {
        setRedirectTarget('/admin');
      } else if (user?.type === 'department' && user.departmentCode) {
        setRedirectTarget(`/departments/${user.departmentCode}`);
      } else {
        setRedirectTarget('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, requiredRole, user]);

  useEffect(() => {
    if (redirectTarget) {
      router.push(redirectTarget);
    }
  }, [redirectTarget, router]);

  if (isLoading || redirectTarget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
