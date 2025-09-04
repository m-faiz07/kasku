import { create } from "zustand";
import { ymKey } from "./format";
import { api } from "./api";

export type Tx = {
  id: string;
  type: "in" | "out";
  amount: number;
  category?: string;
  note?: string;
  date: string; // ISO
  memberId?: string; // <-- untuk menautkan transaksi iuran ke mahasiswa (opsional)
};

type State = {
  txs: Tx[];
  syncing: boolean;
  syncAll: () => Promise<void>;
  addTx: (t: Omit<Tx, "id">) => void;
  deleteTx: (id: string) => void;
  byMonth: (ym?: string) => Tx[];
  totals: (ym?: string) => { in: number; out: number; balance: number };
  clearAll: () => void;
};

export const useStore = create<State>()((set, get) => ({
  txs: [],
  syncing: false,
  syncAll: async () => {
    set({ syncing: true });
    try {
      const list = await api.getTxs();
      set({ txs: list });
    } finally {
      set({ syncing: false });
    }
  },
  addTx: (t) => {
    void (async () => {
      const created = await api.addTx(t);
      set((s) => ({ txs: [created, ...s.txs] }));
    })();
  },
  deleteTx: (id) => {
    void (async () => {
      await api.deleteTx(id);
      set((s) => ({ txs: s.txs.filter((x) => x.id !== id) }));
    })();
  },
  byMonth: (ym) => {
    const key = ym ?? ymKey(new Date());
    return get().txs.filter((t) => ymKey(t.date) === key);
  },
  totals: (ym) => {
    const list = ym ? get().byMonth(ym) : get().txs;
    const tin = list.filter((t) => t.type === "in").reduce((a, b) => a + b.amount, 0);
    const tout = list.filter((t) => t.type === "out").reduce((a, b) => a + b.amount, 0);
    return { in: tin, out: tout, balance: tin - tout };
  },
  clearAll: () => set({ txs: [] }),
}));
