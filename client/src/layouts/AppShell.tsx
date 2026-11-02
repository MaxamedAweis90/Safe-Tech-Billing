import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { useNavStore } from '../store/useNavStore';
import { IconX } from '../components/icons';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { toasts, activeModal, closeModal } = useUIStore();
  const { role, can } = useAuthStore();
  const { activeTab, setActiveTab, mobileDrawerOpen, setMobileDrawerOpen } = useNavStore();
  const roleInfo = ROLES[role];

  // Global Escape key listener for active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal]);

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
      <div id="modalRoot">
        {activeModal && (
          <div
            id="mbg"
            className="modal-bg"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              className={`modal ${activeModal.wide ? 'wide' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-label={activeModal.title}
            >
              <div className="modal-head">
                <h3>{activeModal.title}</h3>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <IconX size={16} />
                </button>
              </div>
              <div className="modal-body">{activeModal.body}</div>
              {activeModal.foot && <div className="modal-foot">{activeModal.foot}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Toast Notifications Container matching prototype `#toasts` */}
      <div id="toasts" className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.bad ? 'bad' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};
