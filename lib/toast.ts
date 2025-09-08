import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export type ToastData = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms
};

type ToastState = {
  current: ToastData | null;
  show: (t: Omit<ToastData, "id"> & { id?: number }) => void;
  hide: () => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
};

let timer: any = null;
let seq = 1;

export const useToast = create<ToastState>()((set) => ({
  current: null,
  show: (t) => {
    // Clear previous timer if any
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const id = t.id ?? seq++;
    const duration = t.duration ?? 2200;
    set({ current: { id, type: t.type, title: t.title, message: t.message, duration } });
    timer = setTimeout(() => {
      set({ current: null });
      timer = null;
    }, duration);
  },
  hide: () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    set({ current: null });
  },
  success: (title, message, duration) => {
    useToast.getState().show({ type: "success", title, message, duration });
  },
  error: (title, message, duration) => {
    useToast.getState().show({ type: "error", title, message, duration });
  },
  info: (title, message, duration) => {
    useToast.getState().show({ type: "info", title, message, duration });
  },
}));

