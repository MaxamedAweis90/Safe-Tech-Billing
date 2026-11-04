import React from 'react';
import { AuthTeaserPanel, AuthTeaserMeta } from './AuthTeaserPanel';

export interface AuthLayoutProps {
  children: React.ReactNode;
  teaserMeta?: AuthTeaserMeta;
}

/**
 * Full-Viewport Edge-to-Edge Split Layout (100vw × 100vh)
 * Eliminates letterboxing and outer container cards.
 * Left panel: Ambient obsidian branding & live ledger snippets (hidden on mobile).
 * Right panel: Ergonomically constrained form surface with smooth scroll isolation.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, teaserMeta }) => {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex bg-[#0D121A] text-[#E1E7F0] select-none font-sans">
      {/* Left Teaser Panel (Desktop / High-Res) */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[48%] h-full flex-col justify-between border-r border-[#243042] bg-[#0A0F17] relative overflow-hidden select-none">
        <AuthTeaserPanel meta={teaserMeta} />
      </div>

      {/* Right Interactive Form Surface (Edge-to-Edge with centered ergonomic container) */}
      <div className="flex-1 h-full bg-[#151C27] flex flex-col justify-center items-center overflow-y-auto px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-md my-auto">
          {/* Mobile-only compact brand header shown on small viewports (<1024px) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#0A0F17] border border-[#243042] flex items-center justify-center overflow-hidden flex-none">
              <img
                src="/logo.png"
                alt="Safe Tech"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="text-white text-base font-bold tracking-tight">
                Safe Tech <span className="text-[#6E9CF0]">Billing</span>
              </div>
              <div className="text-[#6F7B90] text-xs">Enterprise Financial Engine</div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
