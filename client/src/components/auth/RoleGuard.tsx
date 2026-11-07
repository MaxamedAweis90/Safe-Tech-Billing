import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useUIStore';

export interface RoleGuardProps {
  children: React.ReactNode;
  permission: string;
}

/**
 * RoleGuard: Intercepts unauthorized route navigation before child view mounts.
 * Eliminates screen flashing and redirects unauthorized roles safely to /dashboard.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ children, permission }) => {
  const { can, authStatus } = useAuthStore();
  const navigate = useNavigate();

  const hasAccess = can(permission);

  useEffect(() => {
    if (authStatus === 'authenticated' && !hasAccess) {
      toast("You don't have permission to access that section.", true);
      navigate('/dashboard', { replace: true });
    }
  }, [authStatus, hasAccess, navigate]);

  if (authStatus === 'loading' || authStatus === 'idle') {
    return null;
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default RoleGuard;

