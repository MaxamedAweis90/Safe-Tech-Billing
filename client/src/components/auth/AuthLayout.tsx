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
  isSuccess?: boolean;          // Active when onboarding reaches SUCCESS celebration
}

/**
 * Animated Sliding "Poster Morph" Transition (Login ↔ Register ↔ Success Full-Width)
 *
 * In Login Mode: Poster is on Left (0%), Form on Right (50%).
 * In Register Mode: Poster slides to Right (50%), Form reveals on Left (0%).
 * In Success State: Poster slides off-screen to Right (translate-x-[200%]),
 *                   Form Slot smoothly expands to Full-Width (100vw) centered content.
 * Transition uses fluid cubic-bezier easing over 750ms with zero layout flicker.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  mode = 'login',
  teaserMeta,
  leftSlot,
  rightSlot,
  children,
  isSuccess = false,
}) => {
  // If children is passed directly without dual slots, render classic single-mode layout
  if (!leftSlot && !rightSlot && children) {
    return (
      <div className="relative w-full min-h-[100dvh] lg:h-screen lg:overflow-hidden overflow-x-hidden flex bg-[#0D121A] text-[#E1E7F0] select-none font-sans">
        {/* Floating Demo Trigger Pill - hidden during success */}
        {!isSuccess && <DemoButton mode={mode} />}

        {/* Desktop Sliding Poster - slides completely off-screen to the right on success */}
        <div
          className="hidden lg:block w-1/2 h-full absolute top-0 bottom-0 left-0 z-20 overflow-hidden bg-[#090C11] will-change-transform"
          style={{
            transform: isSuccess
              ? 'translateX(100vw)'
              : mode === 'register'
              ? 'translateX(100%)'
              : 'translateX(0%)',
            opacity: isSuccess ? 0 : 1,
            pointerEvents: isSuccess ? 'none' : 'auto',
            borderLeft: mode === 'register' && !isSuccess ? '1px solid #243042' : 'none',
            borderRight: mode === 'login' && !isSuccess ? '1px solid #243042' : 'none',
            transition:
              'transform 750ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease, border 300ms ease',
          }}
        >
          <AuthTeaserPanel mode={mode} meta={teaserMeta} />
        </div>

        {/* Form Slot - morphs to full-width centered on success */}
        <div
          className={`min-h-[100dvh] lg:min-h-0 lg:h-full flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:p-16 overflow-y-auto bg-[#151C27] transition-all duration-750 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSuccess
              ? 'w-full lg:w-full lg:ml-0 z-30'
              : mode === 'register'
              ? 'w-full lg:w-1/2 lg:mr-auto'
              : 'w-full lg:w-1/2 lg:ml-auto'
          }`}
        >
          <div
            className={`w-full my-auto transition-all duration-750 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSuccess ? 'max-w-xl mx-auto' : 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md mx-auto'
            }`}
          >
            {/* Mobile-only compact brand header (<1024px) */}
            {!isSuccess && (
              <div className="lg:hidden flex items-center gap-3 mb-6 sm:mb-8 pr-14 sm:pr-0">
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
            )}

            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] lg:h-screen lg:overflow-hidden overflow-x-hidden flex bg-[#0D121A] text-[#E1E7F0] select-none font-sans">
      {/* Floating Demo Trigger Pill - hidden during success */}
      {!isSuccess && <DemoButton mode={mode} />}

      {/* ========================================================================= */}
      {/* 1. SLIDING POSTER PANEL (Desktop Only, z-20)                             */}
      {/* Slides completely off-screen to the right (translateX(100vw)) on SUCCESS   */}
      {/* ========================================================================= */}
      <div
        className="hidden lg:block w-1/2 h-full absolute top-0 bottom-0 left-0 z-20 overflow-hidden bg-[#090C11] will-change-transform"
        style={{
          transform: isSuccess
            ? 'translateX(100vw)'
            : mode === 'register'
            ? 'translateX(100%)'
            : 'translateX(0%)',
          opacity: isSuccess ? 0 : 1,
          pointerEvents: isSuccess ? 'none' : 'auto',
          borderLeft: mode === 'register' && !isSuccess ? '1px solid #243042' : 'none',
          borderRight: mode === 'login' && !isSuccess ? '1px solid #243042' : 'none',
          transition:
            'transform 750ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease, border 300ms ease',
        }}
      >
        <AuthTeaserPanel mode={mode} meta={teaserMeta} />
      </div>

      {/* ========================================================================= */}
      {/* 2. LEFT FORM SLOT (Active during 'register' & Morphs to Full-Width)      */}
      {/* ========================================================================= */}
      <div
        className={`min-h-[100dvh] lg:min-h-0 lg:h-full flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:p-16 overflow-y-auto bg-[#151C27] transition-all duration-750 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSuccess
            ? 'w-full lg:w-full opacity-100 pointer-events-auto z-30'
            : mode === 'register'
            ? 'w-full lg:w-1/2 opacity-100 pointer-events-auto z-10 flex'
            : 'hidden lg:flex lg:w-1/2 opacity-0 pointer-events-none z-0'
        }`}
      >
        <div
          className={`w-full my-auto transition-all duration-750 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSuccess ? 'max-w-xl mx-auto' : 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md mx-auto'
          }`}
        >
          {/* Mobile-only compact brand header shown on small viewports (<1024px) */}
          {!isSuccess && (
            <div className="lg:hidden flex items-center gap-3 mb-6 sm:mb-8 pr-14 sm:pr-0">
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
          )}

          {leftSlot}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT FORM SLOT (Active during 'login' at 50%)                        */}
      {/* ========================================================================= */}
      <div
        className={`min-h-[100dvh] lg:min-h-0 lg:h-full flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:p-16 overflow-y-auto bg-[#151C27] ${
          !isSuccess && mode === 'login'
            ? 'w-full lg:w-1/2 opacity-100 pointer-events-auto z-10 flex'
            : isSuccess
            ? 'hidden w-0 pointer-events-none opacity-0'
            : 'hidden lg:flex lg:w-1/2 opacity-0 pointer-events-none z-0'
        }`}
        style={{
          transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms',
        }}
      >
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md my-auto mx-auto">
          {/* Mobile-only compact brand header shown on small viewports (<1024px) */}
          <div className="lg:hidden flex items-center gap-3 mb-6 sm:mb-8 pr-14 sm:pr-0">
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
