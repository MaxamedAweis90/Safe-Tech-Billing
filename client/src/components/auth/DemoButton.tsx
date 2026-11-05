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
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/dashboard');
    }
    setActiveTab('dashboard');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fixed top-4 sm:top-6 z-50 group flex items-center h-9 rounded-full bg-[#151C27] border border-[#243042] text-[#6E9CF0] hover:border-[#3B82F6] hover:bg-[#1C2534] hover:text-white cursor-pointer px-2.5 shadow-sm select-none ${
        isRight ? 'flex-row-reverse' : 'flex-row'
      } ${className}`}
      style={{
        left: isRight ? (isDesktop ? 'calc(100% - 24px)' : 'calc(100% - 16px)') : '24px',
        transform: isRight ? 'translateX(-100%)' : 'translateX(0)',
        transition:
          'left 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms ease, background-color 200ms ease',
      }}
      title="Live Demo Mode"
      aria-label="Live Demo Mode"
    >
      {/* Crisp Play Icon */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        <svg
          className="w-3.5 h-3.5 fill-current transition-colors duration-200"
          viewBox="0 0 24 24"
        >
          <polygon points="6 4 20 12 6 20 6 4" />
        </svg>
      </div>

      {/* Expandable Text Label (reveals on hover to the left or right depending on position) */}
      <div
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 ${
          isRight ? 'group-hover:mr-2' : 'group-hover:ml-2'
        }`}
      >
        <span className="text-xs font-mono font-medium tracking-wide">Live Demo</span>
      </div>
    </button>
  );
};

export default DemoButton;
