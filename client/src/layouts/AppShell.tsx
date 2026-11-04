import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ModalRoot } from '../components/common/ModalRoot';
import { ToastContainer } from '../components/common/ToastContainer';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { useNavStore } from '../store/useNavStore';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { role, can } = useAuthStore();
  const { activeTab, setActiveTab, mobileDrawerOpen, setMobileDrawerOpen } = useNavStore();
  const roleInfo = ROLES[role];

  // Route guarding
  const isForbidden =
    (activeTab === 'settings' && !can('settings')) ||
    (activeTab === 'audit' && !can('audit'));

  return (
    <div className="app" id="app">
      {/* Sidebar matching prototype #side */}
      <Sidebar />

      {/* Backdrop matching prototype #drawerBg */}
      <div
        id="drawerBg"
        className={`drawer-bg ${mobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main">
        <Header />
        <div className="page" id="view">
          {isForbidden ? (
            <div className="panel">
              <div className="empty">
                That page isn&apos;t available for the {roleInfo.label} role.{' '}
                <a
                  href="#dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('dashboard');
                  }}
                >
                  Go to the dashboard
                </a>
                .
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Universal Modal Anchor matching prototype `#modalRoot` */}
      <ModalRoot />

      {/* Persistent Toast Notifications Container matching prototype `#toasts` */}
      <ToastContainer />
    </div>
  );
};
