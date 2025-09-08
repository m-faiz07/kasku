import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "./api";

type User = { id: string; email: string; name?: string; avatar?: string };

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  loading: boolean;
  error?: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (email: string, password: string) => Promise<void>;
};

const TOK_KEY = "kasku.auth.token";
const USER_KEY = "kasku.auth.user";

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  loading: false,
  error: null,
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [tok, usr] = await Promise.all([
        SecureStore.getItemAsync(TOK_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      const user = usr ? (JSON.parse(usr) as User) : null;
      set({ token: tok || null, user });
      api.setAuthToken(tok || null);
    } finally {
      set({ hydrated: true });
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const out = await api.login(email, password);
      set({ token: out.token, user: out.user });
      api.setAuthToken(out.token);
      await Promise.all([
        SecureStore.setItemAsync(TOK_KEY, out.token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(out.user)),
      ]);
    } catch (e: any) {
      set({ error: e?.message || "Login gagal" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },
  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const out = await api.register(email, password, name);
      set({ token: out.token, user: out.user });
      api.setAuthToken(out.token);
      await Promise.all([
        SecureStore.setItemAsync(TOK_KEY, out.token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(out.user)),
      ]);
    } catch (e: any) {
      set({ error: e?.message || "Registrasi gagal" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    set({ user: null, token: null });
    api.setAuthToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOK_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(USER_KEY).catch(() => {}),
    ]);
  },
  updateProfile: async (name: string) => {
    const u = await api.updateMe(name);
    set({ user: u });
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
  },
  refreshMe: async () => {
    const tok = get().token;
    if (!tok) return;
    const u = await api.getMe();
    set({ user: u });
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
  },
  changePassword: async (oldPassword, newPassword) => {
    await api.updatePassword(oldPassword, newPassword);
  },
  changeEmail: async (email, password) => {
    const out = await api.updateEmail(email, password);
    set({ token: out.token, user: out.user });
    api.setAuthToken(out.token);
    await Promise.all([
      SecureStore.setItemAsync(TOK_KEY, out.token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(out.user)),
    ]);
  },
}));
