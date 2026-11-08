import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavStore, tabToPath } from '../store/useNavStore';
import { useAuthStore, getAvatarInitials } from '../store/useAuthStore';
import { useCompanySettings } from '../hooks/useSettings';
import { SearchBar } from './SearchBar';
import { RoleSelect } from './RoleSelect';
import { Icon } from '../components/icons';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const { toggleMobileDrawer, setActiveTab } = useNavStore();
  const { user, role, logout } = useAuthStore();
  const { data: companyData } = useCompanySettings();

  const isDemoSession = Boolean(user?.isDemo && (user?.email === 'demo@account.com' || user?.id === 'usr_demo_admin'));
  const company = companyData?.company;
  const companyName = company?.name || user?.companyName || (isDemoSession ? 'Safe Tech Solutions' : 'My Business');
  const userName = user?.fullName || user?.name || 'Staff User';
  const userContact = user?.email || user?.phone || 'authenticated';
  const initials = getAvatarInitials(userName);

  const roleBadgeConfig: Record<string, { label: string; className: string }> = {
    admin: { label: 'Administrator', className: 'chip c-blue' },
    accountant: { label: 'Accountant', className: 'chip c-teal' },
    sales: { label: 'Sales Officer', className: 'chip c-purple' },
    viewer: { label: 'Viewer', className: 'chip c-muted' },
  };
  const badge = roleBadgeConfig[role] || roleBadgeConfig.viewer;

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleNav = (tab: any, hashSuffix?: string) => {
    setDropdownOpen(false);
    setActiveTab(tab);
    if (hashSuffix) {
      const clean = hashSuffix.replace(/^[#/]+/, '');
      navigate(`/${tab}/${clean}`);
    } else {
      navigate(tabToPath(tab));
    }
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
  };

  return (
    <header className="top">
      {/* Mobile Menu Trigger Button */}
      <button
        id="menuBtn"
        type="button"
        onClick={toggleMobileDrawer}
        className="icon-btn menu-btn"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Global Search Component */}
      <SearchBar />

      {/* Top Right: Sample Tag, Role Switcher & User Avatar */}
      <div className="top-right" style={{ position: 'relative' }}>
        {isDemoSession ? (
          <>
            <span
              className="sample-tag"
              title="Demo mode active with isolated simulation data"
            >
              Sample data
            </span>
            <RoleSelect />
          </>
        ) : (
          <span
            className={badge.className}
            style={{ fontSize: '12px', padding: '3px 9px', display: 'inline-flex', alignItems: 'center' }}
            title={`Assigned Workspace Role: ${badge.label}`}
          >
            {badge.label}
          </span>
        )}

        {/* User Avatar with Toggle Dropdown */}
        <div
          ref={avatarRef}
          id="avatar"
          className="avatar"
          title={`Signed in as ${userName} (${badge.label})`}
          onClick={() => setDropdownOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDropdownOpen((prev) => !prev);
            }
          }}
        >
          {initials}
        </div>

        {/* Floating Menu Popover */}
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              backgroundColor: '#151C27',
              border: '1px solid #243042',
              borderRadius: '8px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
              zIndex: 60,
              padding: '14px 0',
              color: '#E5EAF2',
              fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* User Header Section */}
            <div style={{ padding: '0 16px 12px 16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#9AA6BA',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userContact}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={badge.className} style={{ fontSize: '11px', height: '20px' }}>
                  {badge.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#6F7B90',
                  marginTop: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Associated with <strong style={{ color: '#B9C5DA' }}>{companyName}</strong>
              </div>
            </div>

            {/* Divider Line */}
            <div style={{ height: '1px', backgroundColor: '#243042', margin: '4px 0' }} />

            {/* Navigation Links */}
            <div style={{ padding: '4px 8px' }}>
              <button
                type="button"
                onClick={() => handleNav('settings', 'company')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: 0,
                  backgroundColor: 'transparent',
                  color: '#E5EAF2',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1C2636';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon name="set" size={16} />
                <span>Settings &amp; Preferences</span>
              </button>

              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNav('settings', 'team')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: 0,
                    backgroundColor: 'transparent',
                    color: '#E5EAF2',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C2636';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon name="cust" size={16} />
                  <span>Team &amp; Staff Management</span>
                </button>
              )}

              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNav('settings', 'templates')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: 0,
                    backgroundColor: 'transparent',
                    color: '#E5EAF2',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C2636';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Email Templates</span>
                </button>
              )}

              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNav('trash')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: 0,
                    backgroundColor: 'transparent',
                    color: '#E5EAF2',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1C2636';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon name="trash" size={16} />
                  <span>Trash &amp; Recycle Bin</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNav('blueprint')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: 0,
                  backgroundColor: 'transparent',
                  color: '#E5EAF2',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1C2636';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon name="bp" size={16} />
                <span>System Blueprint &amp; Specs</span>
              </button>
            </div>

            {/* Divider Line */}
            <div style={{ height: '1px', backgroundColor: '#243042', margin: '4px 0' }} />

            {/* Sign Out Button */}
            <div style={{ padding: '4px 8px' }}>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: 0,
                  backgroundColor: 'transparent',
                  color: '#F07A70',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(240, 122, 112, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

