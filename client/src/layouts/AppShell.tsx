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
  const { role, can, user, exitDemoSession } = useAuthStore();
  const { activeTab, setActiveTab, mobileDrawerOpen, setMobileDrawerOpen } = useNavStore();
  const roleInfo = ROLES[role];
  const isDemo = Boolean(user?.isDemo);

  // Route guarding
  const isForbidden =
    (activeTab === 'settings' && !can('settings')) ||
    (activeTab === 'audit' && !can('audit'));

  return (
    <div className={`min-h-screen flex flex-col bg-[#0D121A] ${isDemo ? 'has-demo-banner' : ''}`}>
      {/* Persistent Demo Session Banner */}
      {isDemo && (
        <div className="w-full h-[40px] box-border bg-[#1A2638] border-b border-[#2B4263] px-4 flex items-center justify-between text-xs font-mono text-[#A8C7FA] shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#6E9CF0]/20 text-[#6E9CF0] font-semibold text-[11px] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6E9CF0] animate-pulse" />
              DEMO SESSION
            </span>
            <span className="truncate hidden sm:inline">
              Operating in mock memory ledger (zero database writes). Feel free to test invoices, quotes, and settings.
            </span>
            <span className="truncate sm:hidden">
              Mock memory ledger (zero DB writes)
            </span>
          </div>
          <button
            type="button"
            onClick={exitDemoSession}
            className="px-2.5 py-1 rounded bg-[#243042] hover:bg-[#2D3C52] text-white text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ml-3"
            title="Exit demo session and return to login"
          >
            <span>Exit Demo</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}

      <div className="app flex-1" id="app">
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
    </div>
  );
};
