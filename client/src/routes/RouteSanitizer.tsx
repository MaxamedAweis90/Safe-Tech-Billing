import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Step 8.1: Top-Level Route Normalization Interceptor
 *
 * Permanently eliminates hash fragment routing leaks (e.g., /Dashboard#login or /#login).
 * Inspects window.location.hash, strips the fragment, and performs standard React Router navigation
 * with replace: true to maintain pristine, clean URL paths.
 */
export const RouteSanitizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sanitizeHash = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const raw = hash.replace(/^#\/?/, '');
      const [hashRoute, queryStr] = raw.split('?');
      const cleanRoute = hashRoute.toLowerCase();
      const queryPart = queryStr ? `?${queryStr}` : '';

      // Clear the hash from address bar immediately
      const targetBase = window.location.pathname !== '/' ? window.location.pathname : '';

      if (cleanRoute.includes('login')) {
        window.history.replaceState(null, '', `/login${queryPart}`);
        navigate(`/login${queryPart}`, { replace: true });
      } else if (cleanRoute.includes('signup') || cleanRoute.includes('onboarding')) {
        window.history.replaceState(null, '', `/signup${queryPart}`);
        navigate(`/signup${queryPart}`, { replace: true });
      } else if (cleanRoute.includes('verify')) {
        window.history.replaceState(null, '', `/verify${queryPart}`);
        navigate(`/verify${queryPart}`, { replace: true });
      } else if (cleanRoute.includes('accept-invite')) {
        window.history.replaceState(null, '', `/accept-invite${queryPart}`);
        navigate(`/accept-invite${queryPart}`, { replace: true });
      } else if (
        [
          'dashboard',
          'quotations',
          'invoices',
          'receipts',
          'customers',
          'reports',
          'settings',
          'audit',
          'blueprint',
        ].includes(cleanRoute)
      ) {
        window.history.replaceState(null, '', `/${cleanRoute}${queryPart}`);
        navigate(`/${cleanRoute}${queryPart}`, { replace: true });
      } else {
        // Strip unexpected hash leaks
        window.history.replaceState(null, '', targetBase || '/');
      }
    };

    sanitizeHash();
    window.addEventListener('hashchange', sanitizeHash);
    return () => window.removeEventListener('hashchange', sanitizeHash);
  }, [navigate, location]);

  return <>{children}</>;
};

export default RouteSanitizer;

