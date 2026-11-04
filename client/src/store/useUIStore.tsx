import React from 'react';
import { create } from 'zustand';
import { useToastStore, toast as toastFn, ToastItem } from './useToastStore';

export type { ToastItem };

export interface ModalConfig {
  title: string;
  body: React.ReactNode;
  foot?: React.ReactNode;
  wide?: boolean;
  onMount?: () => void;
  onClose?: () => void;
}

export interface ConfirmBoxOptions {
  title: string;
  text: string;
  ok?: string;
  danger?: boolean;
  reason?: string;
}

interface UIState {
  // Mobile Drawer Toggle State
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;

  // Global Search Query
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Document Sheet Scale Value
  sheetScale: number;
  setSheetScale: (scale: number) => void;

  // Modal Stack & Active Modal
  activeModal: ModalConfig | null;
  modalStack: ModalConfig[];
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
  closeAllModals: () => void;

  // Legacy Toasts compatibility
  toasts: ToastItem[];
  addToast: (message: string, bad?: boolean) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Drawer
  isDrawerOpen: false,
  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  // Search
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Sheet Scale
  sheetScale: 1,
  setSheetScale: (sheetScale) => set({ sheetScale }),

  // Modal Stack
  activeModal: null,
  modalStack: [],
  openModal: (config) =>
    set((state) => ({
      activeModal: config,
      modalStack: [...state.modalStack, config],
    })),
  closeModal: () => {
    set((state) => {
      const topModal = state.activeModal;
      if (topModal?.onClose) {
        topModal.onClose();
      }
      const newStack = state.modalStack.slice(0, -1);
      return {
        activeModal: newStack.length > 0 ? newStack[newStack.length - 1] : null,
        modalStack: newStack,
      };
    });
  },
  closeAllModals: () => {
    set((state) => {
      state.modalStack.forEach((m) => m.onClose?.());
      return { activeModal: null, modalStack: [] };
    });
  },

  // Legacy Toasts delegation
  toasts: [],
  addToast: (message, bad = false) => {
    useToastStore.getState().addToast(message, bad);
    set({ toasts: useToastStore.getState().toasts });
  },
  removeToast: (id) => {
    useToastStore.getState().removeToast(id);
    set({ toasts: useToastStore.getState().toasts });
  },
}));

// Sync toasts subscription
useToastStore.subscribe((state) => {
  useUIStore.setState({ toasts: state.toasts });
});

/**
 * Global toast trigger matching prototype `toast(msg, bad)`
 */
export const toast = toastFn;

/**
 * Universal modal opening helper matching prototype `openModal()`
 */
export function openModal(config: ModalConfig) {
  useUIStore.getState().openModal(config);
}

/**
 * Universal modal closing helper matching prototype `closeModal()`
 */
export function closeModal() {
  useUIStore.getState().closeModal();
}

/**
 * Universal confirmation dialog matching prototype `confirmBox()`
 * Resolves with `string` (if reason requested), `true` (if confirmed), or `false` (if cancelled).
 */
export function confirmBox({
  title,
  text,
  ok = 'Confirm',
  danger = false,
  reason,
}: ConfirmBoxOptions): Promise<string | boolean> {
  return new Promise((resolve) => {
    let reasonInput = '';

    const handleConfirm = () => {
      if (reason && !reasonInput.trim()) {
        toast('A reason is required for the audit trail.', true);
        return;
      }
      closeModal();
      resolve(reason ? reasonInput.trim() : true);
    };

    const handleCancel = () => {
      closeModal();
      resolve(false);
    };

    openModal({
      title,
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5 }}>{text}</p>
          {reason && (
            <div className="field">
              <label htmlFor="cfReason">{reason}</label>
              <textarea
                id="cfReason"
                className="inp"
                rows={3}
                placeholder="Enter audit explanation..."
                onChange={(e) => {
                  reasonInput = e.target.value;
                }}
              />
            </div>
          )}
        </div>
      ),
      foot: (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={handleCancel}>
            Keep as is
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'danger' : 'primary'}`}
            onClick={handleConfirm}
          >
            {ok}
          </button>
        </div>
      ),
      onClose: () => resolve(false),
    });
  });
}

export default useUIStore;
