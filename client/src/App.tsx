import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { HashRouter } from './components/common/HashRouter';
import { AppShell } from './layouts/AppShell';
import { useNavStore } from './store/useNavStore';
import { DashboardView } from './features/dashboard/DashboardView';
import { QuotationsView } from './features/quotations/QuotationsView';
import { InvoicesView } from './features/invoices/InvoicesView';
import { ReceiptsView } from './features/receipts/ReceiptsView';
import { CustomersView } from './features/customers/CustomersView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';
import { AuditView } from './features/audit/AuditView';
import { BlueprintView } from './features/blueprint/BlueprintView';

export const App: React.FC = () => {
  const { activeTab } = useNavStore();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'quotations':
        return <QuotationsView />;
      case 'invoices':
        return <InvoicesView />;
      case 'receipts':
        return <ReceiptsView />;
      case 'customers':
        return <CustomersView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'audit':
        return <AuditView />;
      case 'blueprint':
        return <BlueprintView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppShell>{renderActiveView()}</AppShell>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
