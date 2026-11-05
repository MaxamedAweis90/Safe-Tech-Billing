import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import { RouteSanitizer } from './RouteSanitizer';
import { AuthBarrier } from '../components/auth/AuthBarrier';
import { AppShell } from '../layouts/AppShell';
import { ToastContainer } from '../components/common/ToastContainer';
import { useAuthStore } from '../store/useAuthStore';
import { useNavStore, parsePath } from '../store/useNavStore';

// Features
import {
  AuthContainer,
  StaffAcceptInviteView,
  VerifyView,
} from '../features/auth';
import { DashboardView } from '../features/dashboard/DashboardView';
import { QuotationsView } from '../features/quotations/QuotationsView';
import { InvoicesView } from '../features/invoices/InvoicesView';
import { ReceiptsView } from '../features/receipts/ReceiptsView';
import { CustomersView } from '../features/customers/CustomersView';
import { ReportsView } from '../features/reports/ReportsView';
import { SettingsView } from '../features/settings/SettingsView';
import { AuditView } from '../features/audit/AuditView';
import { BlueprintView } from '../features/blueprint/BlueprintView';

/**
 * Route sync observer: keeps useNavStore state in sync with React Router's active pathname.
 */
const RouteSync: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const parsed = parsePath(location.pathname);
    useNavStore.setState({
      activeTab: parsed.tab,
      selectedRecordId: parsed.recordId,
      mobileDrawerOpen: false,
    });
  }, [location.pathname]);

  return null;
};

/**
 * Fallback wildcard catch-all: redirects authenticated users to /dashboard and unauthenticated to /login.
 */
const WildcardFallback: React.FC = () => {
  const { isAuthenticated, authStatus } = useAuthStore();

  if (authStatus === 'idle' || authStatus === 'loading') {
    return <AuthBarrier mode="protected"><div /></AuthBarrier>;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

/**
 * Wrapper for detail routes that passes param ID to nav store
 */
const RecordRouteWrapper: React.FC<{
  tab: 'quotations' | 'invoices' | 'receipts' | 'customers';
  children: React.ReactNode;
}> = ({ tab, children }) => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      useNavStore.setState({
        activeTab: tab,
        selectedRecordId: id,
      });
    }
  }, [id, tab]);

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <RouteSanitizer>
        <RouteSync />
        <Routes>
          {/* ========================================================================= */}
          {/* 1. PUBLIC GUEST ROUTES                                                   */}
          {/* ========================================================================= */}
          <Route
            path="/login"
            element={
              <AuthBarrier mode="guest">
                <AuthContainer initialMode="login" />
              </AuthBarrier>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthBarrier mode="guest">
                <AuthContainer initialMode="register" />
              </AuthBarrier>
            }
          />
          <Route
            path="/onboarding"
            element={<Navigate to="/signup" replace />}
          />
          <Route
            path="/verify"
            element={
              <AuthBarrier mode="guest">
                <VerifyView />
              </AuthBarrier>
            }
          />
          <Route
            path="/accept-invite"
            element={
              <AuthBarrier mode="guest">
                <StaffAcceptInviteView />
              </AuthBarrier>
            }
          />

          {/* ========================================================================= */}
          {/* 2. PROTECTED TENANT ROUTES (Wrapped in AuthBarrier & AppShell)          */}
          {/* ========================================================================= */}
          <Route
            path="/dashboard"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <DashboardView />
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Quotations */}
          <Route
            path="/quotations"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <QuotationsView />
                </AppShell>
              </AuthBarrier>
            }
          />
          <Route
            path="/quotations/:id"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <RecordRouteWrapper tab="quotations">
                    <QuotationsView />
                  </RecordRouteWrapper>
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Invoices */}
          <Route
            path="/invoices"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <InvoicesView />
                </AppShell>
              </AuthBarrier>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <RecordRouteWrapper tab="invoices">
                    <InvoicesView />
                  </RecordRouteWrapper>
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Receipts */}
          <Route
            path="/receipts"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <ReceiptsView />
                </AppShell>
              </AuthBarrier>
            }
          />
          <Route
            path="/receipts/:id"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <RecordRouteWrapper tab="receipts">
                    <ReceiptsView />
                  </RecordRouteWrapper>
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Customers */}
          <Route
            path="/customers"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <CustomersView />
                </AppShell>
              </AuthBarrier>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <RecordRouteWrapper tab="customers">
                    <CustomersView />
                  </RecordRouteWrapper>
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Reports */}
          <Route
            path="/reports"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <ReportsView />
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Settings & Subtabs */}
          <Route
            path="/settings"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <SettingsView />
                </AppShell>
              </AuthBarrier>
            }
          />
          <Route
            path="/settings/:subtab"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <SettingsView />
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Audit Logs */}
          <Route
            path="/audit"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <AuditView />
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Blueprint */}
          <Route
            path="/blueprint"
            element={
              <AuthBarrier mode="protected">
                <AppShell>
                  <BlueprintView />
                </AppShell>
              </AuthBarrier>
            }
          />

          {/* Root redirect to Wildcard */}
          <Route path="/" element={<WildcardFallback />} />

          {/* Wildcard Catch-All */}
          <Route path="*" element={<WildcardFallback />} />
        </Routes>
        <ToastContainer />
      </RouteSanitizer>
    </BrowserRouter>
  );
};

export default AppRouter;

