import { View, Text, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useMemo, useState } from "react";
import { useStore } from "../../lib/store";
import { toIDR } from "../../lib/format";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { fs, ms } from "../../lib/responsive";
import { useAuth } from "../../lib/auth";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function Stats() {
  const { totals, txs } = useStore();
  const tAll = totals();
  const insets = useSafeAreaInsets();
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const { logout } = useAuth();

  const safeAllBalance = Math.max(0, tAll.balance);

  const canExport = txs.length > 0;

  const csv = useMemo(() => {
    const header = ["id", "type", "amount", "category", "note", "date", "memberId"].join(",");
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
      return s;
    };
    const rows = txs
      .slice()
      .reverse() // oldest first for readability
      .map((t) => [t.id, t.type, t.amount, t.category ?? "", t.note ?? "", t.date, t.memberId ?? ""].map(esc).join(","));
    return [header, ...rows].join("\n");
  }, [txs]);

  const onExport = async () => {
    try {
      if (!canExport) return;
      const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || FileSystem.cacheDirectory;
      if (!dir) throw new Error("Storage directory not available");
      const fileUri = dir + `kasku-transactions-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      setSavedPath(fileUri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: Platform.OS === "android" ? "text/csv" : undefined,
          dialogTitle: "Ekspor Transaksi (CSV)",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Tersimpan", `File CSV disimpan di: ${fileUri}`);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal Export", e?.message || "Terjadi kesalahan saat menyimpan CSV");
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}>
        <Card title="Total Masuk">{toIDR(tAll.in)}</Card>
        <Card title="Total Keluar">{toIDR(tAll.out)}</Card>
        <Card title="Saldo Total">{toIDR(safeAllBalance)}</Card>
        <View style={{ backgroundColor: "white", padding: 16, borderRadius: 16 }}>
          <Text style={{ fontWeight: "700", marginBottom: 8, fontSize: fs(14) }}>Ekspor</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ekspor transaksi ke file CSV"
            onPress={onExport}
            disabled={!canExport}
            style={{ backgroundColor: canExport ? "#111827" : "#9ca3af", paddingVertical: ms(12), borderRadius: 10, alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: fs(14) }}>Ekspor CSV</Text>
          </Pressable>
          {!canExport && (
            <Text style={{ color: "#6b7280", marginTop: 8, fontSize: fs(12) }}>Belum ada transaksi untuk diekspor.</Text>
          )}
          {!!savedPath && (
            <Text style={{ color: "#6b7280", marginTop: 8, fontSize: fs(12) }}>Lokasi file: {savedPath}</Text>
          )}
        </View>
        <View style={{ backgroundColor: "white", padding: 16, borderRadius: 16 }}>
          <Text style={{ fontWeight: "700", marginBottom: 8, fontSize: fs(14) }}>Akun</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Keluar" onPress={logout} style={{ backgroundColor: "#dc2626", paddingVertical: ms(12), borderRadius: 10, alignItems: "center" }}>
            <Text style={{ color: "white", fontWeight: "700", fontSize: fs(14) }}>Keluar</Text>
          </Pressable>
        </View>
        <Text style={{ color: "#6b7280", marginTop: 12, fontSize: fs(12) }}>
          Tip: pakai kategori berbeda untuk Kas Kelas vs Pribadi (nanti bisa dibuat multi-buku).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <View style={{ backgroundColor: "white", padding: 16, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 }}>
      <Text style={{ color: "#6b7280", fontSize: fs(12) }}>{title}</Text>
      <Text style={{ fontSize: fs(22), fontWeight: "800", marginTop: 6 }}>{children}</Text>
    </View>
  );
}
