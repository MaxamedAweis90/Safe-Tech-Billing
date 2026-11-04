import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';

export interface DemoButtonProps {
  mode?: 'login' | 'register';
  className?: string;
}

/**
 * Floating Interactive Demo Trigger Icon Button.
 *
 * Geometry & Micro-Interactions:
 * - Default: Compact 40×40 obsidian circular icon button with pulsing lightning badge.
 * - Dynamic Positioning:
 *   - Login Mode (form on Right): Positioned at Top-Right (right-6).
 *   - Register Mode (form on Left): Positioned at Top-Left (left-6).
 *   - Glides smoothly across the viewport in sync with poster morph transitions.
 * - On Hover:
 *   - When at Top-Right: Smoothly expands to the LEFT.
 *   - When at Top-Left: Smoothly expands to the RIGHT.
 *   - Reveals "Explore Demo Mode" with "Live" badge.
 */
export const DemoButton: React.FC<DemoButtonProps> = ({ mode, className = '' }) => {
  const bootstrapDemoSession = useAuthStore((state) => state.bootstrapDemoSession);
  const { activeTab, setActiveTab } = useNavStore();

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine effective mode (fallback to activeTab if prop not explicitly provided)
  const effectiveMode =
    mode || (activeTab === 'signup' || activeTab === 'onboarding' ? 'register' : 'login');

  // Desktop: tracks form location (Login = Right, Register = Left). Mobile: safely on Top-Right to avoid logo clash.
  const isRight = !isDesktop || effectiveMode === 'login';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    bootstrapDemoSession();
    setActiveTab('dashboard');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fixed top-4 sm:top-6 z-50 group flex items-center h-10 rounded-full bg-[#151C27]/90 backdrop-blur-md border border-[#243042] text-[#6E9CF0] hover:border-[#6E9CF0] hover:bg-[#1E2736] hover:shadow-[0_0_20px_rgba(110,156,240,0.3)] cursor-pointer px-2.5 shadow-lg select-none ${
        isRight ? 'flex-row-reverse' : 'flex-row'
      } ${className}`}
      style={{
        left: isRight ? (isDesktop ? 'calc(100% - 24px)' : 'calc(100% - 16px)') : '24px',
        transform: isRight ? 'translateX(-100%)' : 'translateX(0)',
        transition:
          'left 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease',
      }}
      title="⚡ Explore Live Demo Mode (Instant pre-hydrated mock data with zero database writes)"
      aria-label="Explore Demo Mode"
    >
      {/* Icon Capsule with Lightning Glyph and Live Pulse Dot */}
      <div className="w-5 h-5 flex items-center justify-center shrink-0 relative">
        <svg
          className="w-4 h-4 text-[#6E9CF0] group-hover:text-white group-hover:scale-110 transition-all duration-200"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6E9CF0] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6E9CF0]" />
        </span>
      </div>

      {/* Expandable Text Label (reveals on hover to the left or right depending on position) */}
      <div
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-w-0 opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 ${
          isRight ? 'group-hover:mr-2.5' : 'group-hover:ml-2.5'
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
          <span className="text-[#E1E7F0]">Explore</span>
          <span className="text-[#6E9CF0] font-semibold">Demo Mode</span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#6E9CF0]/20 text-[#6E9CF0] border border-[#6E9CF0]/30 font-semibold ml-0.5">
            Live
          </span>
        </div>
      </div>
    </button>
  );
};

export default DemoButton;
