import React, { useEffect } from 'react';
import { useNavStore, parseHash } from '../../store/useNavStore';

export interface HashRouterProps {
  children: React.ReactNode;
}

/**
 * HashRouter matching prototype URL hash routing behavior (`window.addEventListener("hashchange", route)`).
 */
export const HashRouter: React.FC<HashRouterProps> = ({ children }) => {
  useEffect(() => {
    // Initial route parse
    const initial = parseHash(window.location.hash);
    useNavStore.setState({
      activeTab: initial.tab,
      selectedRecordId: initial.recordId,
    });

    const handleHashChange = () => {
      const parsed = parseHash(window.location.hash);
      const currentTab = useNavStore.getState().activeTab;
      useNavStore.setState({
        activeTab: parsed.tab,
        selectedRecordId: parsed.recordId,
        mobileDrawerOpen: false,
      });
      if (currentTab !== parsed.tab) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return <>{children}</>;
};

export default HashRouter;

