export type Member = {
  id: string;
  name: string;
  nim?: string;
  phone?: string;
  active: boolean;
};

export type DuesBill = {
  id: string;
  memberId: string;
  ym: string; // YYYY-MM
  amount: number;
  status: "UNPAID" | "PAID" | "WAIVED";
};

export type Tx = {
  id: string;
  type: "in" | "out";
  amount: number;
  category?: string;
  note?: string;
  date: string; // ISO
  memberId?: string;
};

export type Settings = {
  duesAmount: number;
};

export function ymKey(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export type User = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  passwordHash: string;
  createdAt: string; // ISO
};
