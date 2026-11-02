import React from 'react';
import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  bad?: boolean;
}

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
  toasts: ToastItem[];
  addToast: (message: string, bad?: boolean) => void;
  removeToast: (id: string) => void;

  activeModal: ModalConfig | null;
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (message, bad = false) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, bad }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3600);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  activeModal: null,
  openModal: (config) => set({ activeModal: config }),
  closeModal: () => {
    set((state) => {
      if (state.activeModal?.onClose) {
        state.activeModal.onClose();
      }
      return { activeModal: null };
    });
  },
}));

/**
 * Global toast trigger matching prototype `toast(msg, bad)`
 */
export function toast(message: string, bad: boolean = false) {
  useUIStore.getState().addToast(message, bad);
}

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
