import React from 'react';
import { useNavStore } from '../store/useNavStore';
import { useAuthStore, getAvatarInitials } from '../store/useAuthStore';
import { SearchBar } from './SearchBar';
import { RoleSelect } from './RoleSelect';

export const Header: React.FC = () => {
  const { toggleMobileDrawer } = useNavStore();
  const { user } = useAuthStore();
  const initials = getAvatarInitials(user.name);

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
      <div className="top-right">
        <span
          className="sample-tag"
          title="Records other than invoice 10456 are example data"
        >
          Sample data
        </span>

        <RoleSelect />

        <div id="avatar" className="avatar" title={`Signed in as ${user.name}`}>
          {initials}
        </div>
      </div>
    </header>
  );
};
