import React, { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { HashRouter } from "./components/common/HashRouter";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppShell } from "./layouts/AppShell";
import { ToastContainer } from "./components/common/ToastContainer";
import { useNavStore } from "./store/useNavStore";
import { useAuthStore } from "./store/useAuthStore";
import { DashboardView } from "./features/dashboard/DashboardView";
import { QuotationsView } from "./features/quotations/QuotationsView";
import { InvoicesView } from "./features/invoices/InvoicesView";
import { ReceiptsView } from "./features/receipts/ReceiptsView";
import { CustomersView } from "./features/customers/CustomersView";
import { ReportsView } from "./features/reports/ReportsView";
import { SettingsView } from "./features/settings/SettingsView";
import { AuditView } from "./features/audit/AuditView";
import { BlueprintView } from "./features/blueprint/BlueprintView";
import {
  AuthContainer,
  StaffAcceptInviteView,
  VerifyView,
} from "./features/auth";

export const App: React.FC = () => {
  const { activeTab } = useNavStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isAuthRoute = [
    "login",
    "signup",
    "verify",
    "accept-invite",
    "onboarding",
  ].includes(activeTab);

  const renderAuthView = () => {
    switch (activeTab) {
      case "login":
      case "signup":
      case "onboarding":
        return <AuthContainer initialMode={activeTab === "login" ? "login" : "register"} />;
      case "verify":
        return <VerifyView />;
      case "accept-invite":
        return <StaffAcceptInviteView />;
      default:
        return <AuthContainer initialMode="login" />;
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "quotations":
        return <QuotationsView />;
      case "invoices":
        return <InvoicesView />;
      case "receipts":
        return <ReceiptsView />;
      case "customers":
        return <CustomersView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return <SettingsView />;
      case "audit":
        return <AuditView />;
      case "blueprint":
        return <BlueprintView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <ProtectedRoute>
          {isAuthRoute ? (
            <>
              {renderAuthView()}
              <ToastContainer />
            </>
          ) : (
            <AppShell>{renderActiveView()}</AppShell>
          )}
        </ProtectedRoute>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
