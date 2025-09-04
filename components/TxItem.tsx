import { View, Text, Pressable } from "react-native";
import { toIDR } from "../lib/format";
import { Tx } from "../lib/store";

export default function TxItem({ item, onDelete }: { item: Tx; onDelete?: (id: string) => void }) {
  const sign = item.type === "in" ? "+" : "-";
  const color = item.type === "in" ? "#059669" : "#dc2626";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Transaksi ${item.type === "in" ? "masuk" : "keluar"} ${toIDR(item.amount)}. Tahan untuk hapus.`}
      onLongPress={() => onDelete?.(item.id)}
      style={{
        paddingVertical: 12, paddingHorizontal: 14,
        backgroundColor: "white", borderRadius: 12, marginBottom: 10,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
      }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontWeight: "700" }}>{item.category || "Umum"}</Text>
          {!!item.note && <Text style={{ color: "#6b7280" }}>{item.note}</Text>}
          <Text style={{ color: "#9ca3af", marginTop: 2 }}>{new Date(item.date).toLocaleDateString("id-ID")}</Text>
        </View>
        <Text style={{ fontWeight: "800", color }}>{sign} {toIDR(item.amount)}</Text>
      </View>
      <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>Tahan lama untuk hapus</Text>
    </Pressable>
  );
}
