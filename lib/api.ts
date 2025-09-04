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

function getBaseUrl(): string {
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

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getApiKeyHeader()),
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
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
};
