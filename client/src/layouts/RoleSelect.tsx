import React from 'react';
import { useAuthStore, ROLES } from '../store/useAuthStore';
import { UserRole } from '../types';

export const RoleSelect: React.FC = () => {
  const { role, setRole } = useAuthStore();

  return (
    <div className="role">
      <label htmlFor="roleSel">Role</label>
      <select
        id="roleSel"
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
      >
        {Object.entries(ROLES).map(([key, def]) => (
          <option key={key} value={key}>
            {def.label}
          </option>
        ))}
      </select>
    </div>
  );
};

