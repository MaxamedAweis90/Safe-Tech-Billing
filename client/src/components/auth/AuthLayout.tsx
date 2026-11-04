import React from 'react';
import { AuthTeaserPanel, AuthTeaserMeta } from './AuthTeaserPanel';
import { DemoButton } from './DemoButton';

export type AuthMode = 'login' | 'register';

export interface AuthLayoutProps {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  teaserMeta?: AuthTeaserMeta;
  leftSlot?: React.ReactNode;   // Active during 'register' (Slot on Left 0%)
  rightSlot?: React.ReactNode;  // Active during 'login' (Slot on Right 50%)
  children?: React.ReactNode;   // Standalone single-form fallback (e.g. VerifyView, StaffAcceptInviteView)
}

/**
 * Animated Sliding "Poster Morph" Transition (Login ↔ Register)
 *
 * In Login Mode: Poster is on Left (0%), Form on Right (50%).
 * In Register Mode: Poster slides to Right (50%), Form reveals on Left (0%).
 * Transition uses fluid cubic-bezier easing over 700ms with zero layout flicker.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  mode = 'login',
  teaserMeta,
  leftSlot,
  rightSlot,
  children,
}) => {
  // If children is passed directly without dual slots, render classic single-mode layout
  if (!leftSlot && !rightSlot && children) {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex bg-[#0D121A] text-[#E1E7F0] select-none font-sans">
        {/* Floating Demo Trigger Pill */}
        <DemoButton mode={mode} />

        {/* Desktop Fixed Left Poster */}
        <div className="hidden lg:block w-1/2 h-full absolute top-0 bottom-0 left-0 translate-x-0 border-r border-[#243042] z-20 overflow-hidden bg-[#090C11]">
          <AuthTeaserPanel mode={mode} meta={teaserMeta} />
        </div>

        {/* Right Form Slot */}
        <div className="w-full lg:w-1/2 lg:ml-[50%] h-full flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto bg-[#151C27]">
          <div className="w-full max-w-md my-auto">
            {/* Mobile-only compact brand header (<1024px) */}
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
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex bg-[#0D121A] text-[#E1E7F0] select-none font-sans">
      {/* Floating Demo Trigger Pill */}
      <DemoButton mode={mode} />

      {/* ========================================================================= */}
      {/* 1. SLIDING POSTER PANEL (Desktop Only, z-20)                             */}
      {/* ========================================================================= */}
      <div
        className={`hidden lg:block w-1/2 h-full absolute top-0 bottom-0 z-20 overflow-hidden bg-[#090C11] ${
          mode === 'register'
            ? 'left-0 translate-x-full border-l border-[#243042]'
            : 'left-0 translate-x-0 border-r border-[#243042]'
        } will-change-transform`}
        style={{
          transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease',
        }}
      >
        <AuthTeaserPanel mode={mode} meta={teaserMeta} />
      </div>

      {/* ========================================================================= */}
      {/* 2. LEFT FORM SLOT (Active during 'register' at 0%)                       */}
      {/* ========================================================================= */}
      <div
        className={`w-full lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto bg-[#151C27] ${
          mode === 'register'
            ? 'opacity-100 pointer-events-auto z-10 flex'
            : 'opacity-0 pointer-events-none z-0 hidden lg:flex'
        }`}
        style={{
          transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms',
        }}
      >
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

          {leftSlot}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT FORM SLOT (Active during 'login' at 50%)                        */}
      {/* ========================================================================= */}
      <div
        className={`w-full lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto bg-[#151C27] ${
          mode === 'login'
            ? 'opacity-100 pointer-events-auto z-10 flex'
            : 'opacity-0 pointer-events-none z-0 hidden lg:flex'
        }`}
        style={{
          transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms',
        }}
      >
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

          {rightSlot}
        </div>
      </div>
    </div>
  );
};
