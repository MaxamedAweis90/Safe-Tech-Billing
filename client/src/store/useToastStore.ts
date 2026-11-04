import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  bad?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, bad?: boolean) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * Zustand slice for managing transient notification toasts with auto-dismiss timer.
 * Matches prototype `toast(msg, bad)`.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message: string, bad = false) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, bad }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3600);
  },
  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clearToasts: () => set({ toasts: [] }),
}));

/**
 * Universal global toast trigger helper matching prototype `toast(msg, bad)`.
 */
export function toast(message: string, bad: boolean = false) {
  useToastStore.getState().addToast(message, bad);
}

export default useToastStore;

