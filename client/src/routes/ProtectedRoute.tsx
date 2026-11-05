import React from 'react';
import { AuthBarrier } from '../components/auth/AuthBarrier';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard enforcing authenticated access and onboarding gating without hash fragments.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <AuthBarrier mode="protected">{children}</AuthBarrier>;
};

export default ProtectedRoute;
