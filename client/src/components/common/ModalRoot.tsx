import React, { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { IconX } from '../icons';

/**
 * Universal Modal Portal Root component matching prototype `#modalRoot`.
 */
export const ModalRoot: React.FC = () => {
  const { activeModal, closeModal } = useUIStore();

  useEffect(() => {
    if (activeModal?.onMount) {
      activeModal.onMount();
    }
  }, [activeModal]);

  const handleDismiss = () => {
    if (activeModal?.onClose) {
      activeModal.onClose();
    }
    closeModal();
  };

  // Global Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  if (!activeModal) {
    return <div id="modalRoot" />;
  }

  return (
    <div id="modalRoot">
      <div
        id="mbg"
        className="modal-bg"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}
      >
        <div
          className={`modal ${activeModal.wide ? 'wide' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={activeModal.title}
        >
          <div className="modal-head">
            <h3>{activeModal.title}</h3>
            <button
              type="button"
              className="icon-btn"
              onClick={handleDismiss}
              aria-label="Close"
            >
              <IconX size={16} />
            </button>
          </div>
          <div className="modal-body">{activeModal.body}</div>
          {activeModal.foot && <div className="modal-foot">{activeModal.foot}</div>}
        </div>
      </div>
    </div>
  );
};

export default ModalRoot;

