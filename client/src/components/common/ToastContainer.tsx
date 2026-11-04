import React from 'react';
import { useToastStore } from '../../store/useToastStore';

/**
 * Global persistent toast notifications container matching prototype `#toasts`.
 */
export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toasts" className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.bad ? 'bad' : ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

