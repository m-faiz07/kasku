// Minimal API client for Kasku server
import { Platform } from "react-native";

export type Tx = {
  id: string;
  type: "in" | "out";
  amount: number;
  category?: string;
  note?: string;
  date: string;
  memberId?: string;
};

export type Member = { id: string; name: string; nim?: string; phone?: string; active: boolean };

export type DuesBill = { id: string; memberId: string; ym: string; amount: number; status: "UNPAID" | "PAID" | "WAIVED" };

const DEFAULT_BASE = "http://localhost:4000";

export function getBaseUrl(): string {
  // Option A: Expo extra
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    const fromExtra = Constants?.expoConfig?.extra?.apiBaseUrl as string | undefined;
    if (fromExtra) return normalizeBase(fromExtra);
  } catch {}
  // Option B: Public env (EAS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pub = (process as any)?.env?.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  return normalizeBase(pub || DEFAULT_BASE);
}

let AUTH_TOKEN: string | null = null;

export function setAuthToken(token: string | null) {
  AUTH_TOKEN = token;
}

export class HttpError extends Error {
  status: number;
  data?: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getApiKeyHeader()),
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    // Try parse JSON error for a friendly message
    let data: any = null;
    try { data = await res.json(); } catch {
      try { const txt = await res.text(); data = txt; } catch {}
    }
    const msg = (data && typeof data === 'object' ? (data.message || data.error) : undefined) || res.statusText || 'Request failed';
    throw new HttpError(res.status, msg, data);
  }
  return (await res.json()) as T;
}

function getApiKeyHeader(): Record<string, string> | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    const key = Constants?.expoConfig?.extra?.apiKey as string | undefined;
    if (key) return { "x-api-key": key };
  } catch {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pub = (process as any)?.env?.EXPO_PUBLIC_API_KEY as string | undefined;
  if (pub) return { "x-api-key": pub };
  return undefined;
}

function normalizeBase(raw: string): string {
  try {
    if (Platform.OS === "android") {
      // Map localhost/127.0.0.1 to Android emulator host
      return raw
        .replace("http://localhost:", "http://10.0.2.2:")
        .replace("http://127.0.0.1:", "http://10.0.2.2:");
    }
    return raw;
  } catch {
    return raw;
  }
}

// Members
export const api = {
  // Auth
  login: (email: string, password: string) => fetchJson<{ token: string; user: { id: string; email: string; name?: string; avatar?: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name?: string) => fetchJson<{ token: string; user: { id: string; email: string; name?: string; avatar?: string } }>("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  getMe: () => fetchJson<{ id: string; email: string; name?: string; avatar?: string }>("/me"),
  updateMe: (name: string) => fetchJson<{ id: string; email: string; name?: string; avatar?: string }>("/me", { method: "PATCH", body: JSON.stringify({ name }) }),
  updatePassword: (oldPassword: string, newPassword: string) => fetchJson<{ ok: true }>("/me/password", { method: "PATCH", body: JSON.stringify({ oldPassword, newPassword }) }),
  uploadAvatar: (imageDataUrl: string) => fetchJson<{ avatarUrl: string }>("/me/avatar", { method: "POST", body: JSON.stringify({ image: imageDataUrl }) }),
  updateEmail: (email: string, password: string) => fetchJson<{ token: string; user: { id: string; email: string; name?: string; avatar?: string } }>("/me/email", { method: "PATCH", body: JSON.stringify({ email, password }) }),

  // Members
  getMembers: () => fetchJson<Member[]>("/members"),
  addMember: (name: string, nim?: string, phone?: string) => fetchJson<Member>("/members", { method: "POST", body: JSON.stringify({ name, nim, phone }) }),
  updateMember: (id: string, patch: Partial<Member>) => fetchJson<Member>(`/members/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  removeMember: (id: string) => fetchJson<{ ok: true }>(`/members/${id}`, { method: "DELETE" }),

  // Dues settings
  getDuesAmount: () => fetchJson<{ duesAmount: number }>("/dues/amount").then((x) => x.duesAmount),
  setDuesAmount: (amount: number) => fetchJson<{ duesAmount: number }>("/dues/amount", { method: "POST", body: JSON.stringify({ amount }) }).then((x) => x.duesAmount),

  // Bills
  getBills: (ym?: string) => fetchJson<DuesBill[]>(ym ? `/bills?ym=${encodeURIComponent(ym)}` : "/bills"),
  generateBills: (ym?: string) => fetchJson<DuesBill[]>("/bills/generate", { method: "POST", body: JSON.stringify({ ym }) }),
  bulkMarkPaid: (memberIds: string[], ym: string) => fetchJson<DuesBill[]>("/bills/bulkPaid", { method: "POST", body: JSON.stringify({ memberIds, ym }) }),

  // Transactions
  getTxs: (ym?: string) => fetchJson<Tx[]>(ym ? `/txs?ym=${encodeURIComponent(ym)}` : "/txs"),
  addTx: (t: Omit<Tx, "id">) => fetchJson<Tx>("/txs", { method: "POST", body: JSON.stringify(t) }),
  deleteTx: (id: string) => fetchJson<{ ok: true }>(`/txs/${id}`, { method: "DELETE" }),
  setAuthToken,
};
