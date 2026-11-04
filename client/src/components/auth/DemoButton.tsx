import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';

/**
 * Floating Demo Trigger Pill component.
 * Fixed at top-6 left-6 z-50, allowing instant activation of live demo mode.
 */
export const DemoButton: React.FC = () => {
  const bootstrapDemoSession = useAuthStore((state) => state.bootstrapDemoSession);
  const setActiveTab = useNavStore((state) => state.setActiveTab);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    bootstrapDemoSession();
    setActiveTab('dashboard');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed top-6 left-6 z-50 flex items-center gap-2 rounded-full px-3.5 py-1.5 bg-[#151C27]/80 backdrop-blur-md border border-[#243042] text-xs font-mono font-medium text-[#6E9CF0] hover:bg-[#1E2736] hover:border-[#6E9CF0] hover:shadow-[0_0_15px_rgba(110,156,240,0.2)] transition-all cursor-pointer shadow-lg"
      title="Bypass auth and explore Safe Tech Billing with pre-hydrated demo data"
    >
      <span className="w-2 h-2 rounded-full bg-[#6E9CF0] animate-pulse shrink-0" />
      <span>⚡ Explore Demo Mode</span>
    </button>
  );
};

export default DemoButton;

