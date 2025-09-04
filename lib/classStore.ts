// lib/classStore.ts
import { create } from "zustand";
import { ymKey } from "./format";
import { useStore } from "./store";
import { api } from "./api";

export type Member = { id: string; name: string; nim?: string; phone?: string; active: boolean };

export type DuesBill = {
  id: string;
  memberId: string;
  ym: string; // "YYYY-MM"
  amount: number;
  status: "UNPAID" | "PAID" | "WAIVED";
  // paidTxId?: string; // (opsional, akan kita isi kalau addTx mengembalikan id)
};

type ClassState = {
  // Anggota
  members: Member[];
  addMember: (name: string, nim?: string, phone?: string) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;
  syncMembers: () => Promise<void>;

  // Nominal iuran per bulan (aktif)
  duesAmount: number;
  setDuesAmount: (amount: number) => void;
  syncDuesAmount: () => Promise<void>;

  // Tagihan iuran
  bills: DuesBill[];
  generateBills: (ym?: string) => void; // buat tagihan UNPAID untuk semua anggota aktif yang belum punya bill di bulan tsb
  markPaid: (memberId: string, ym: string) => void; // bikin Tx pemasukan + ubah status bill ke PAID
  bulkMarkPaid: (memberIds: string[], ym: string) => void;
  syncBills: (ym?: string) => Promise<void>;

  // Helper/selector
  billsForMonth: (ym?: string) => (DuesBill & { member?: Member })[];
};

export const useClassStore = create<ClassState>()((set, get) => ({
  // ====== Anggota ======
  members: [],
  syncMembers: async () => {
    const mem = await api.getMembers();
    set({ members: mem });
  },
  addMember: (name, nim, phone) => {
    void (async () => {
      const m = await api.addMember(name, nim, phone);
      set((s) => ({ members: [m, ...s.members] }));
    })();
  },
  updateMember: (id, patch) => {
    void (async () => {
      const m = await api.updateMember(id, patch);
      set((s) => ({ members: s.members.map((x) => (x.id === id ? m : x)) }));
    })();
  },
  removeMember: (id) => {
    void (async () => {
      await api.removeMember(id);
      set((s) => ({ members: s.members.filter((m) => m.id !== id), bills: s.bills.filter((b) => b.memberId !== id) }));
    })();
  },

  // ====== Iuran ======
  duesAmount: 20000,
  syncDuesAmount: async () => {
    const amt = await api.getDuesAmount();
    set({ duesAmount: amt });
  },
  setDuesAmount: (amount) => {
    void (async () => {
      const normalized = Math.max(0, Math.floor(amount || 0));
      const amt = await api.setDuesAmount(normalized);
      set({ duesAmount: amt });
    })();
  },

  bills: [],
  syncBills: async (ym) => {
    const month = ym ?? ymKey(new Date());
    const list = await api.getBills(month);
    set((s) => {
      const others = s.bills.filter((b) => b.ym !== month);
      return { bills: [...others, ...list] };
    });
  },
  generateBills: (ym) => {
    void (async () => {
      const month = ym ?? ymKey(new Date());
      const list = await api.generateBills(month);
      set((s) => {
        const others = s.bills.filter((b) => b.ym !== month);
        return { bills: [...others, ...list] };
      });
    })();
  },

  markPaid: (memberId, ym) => {
    void get().bulkMarkPaid([memberId], ym);
  },

  bulkMarkPaid: (memberIds, ym) => {
    void (async () => {
      const list = await api.bulkMarkPaid(memberIds, ym);
      set((s) => {
        const others = s.bills.filter((b) => b.ym !== ym);
        return { bills: [...others, ...list] };
      });
      // Refresh transactions since server created Tx entries
      const sync = useStore.getState().syncAll;
      if (sync) await sync();
    })();
  },

  billsForMonth: (ym) => {
    const month = ym ?? ymKey(new Date());
    const { bills, members } = get();
    return bills
      .filter((b) => b.ym === month)
      .map((b) => ({ ...b, member: members.find((m) => m.id === b.memberId) }));
  },
}));
