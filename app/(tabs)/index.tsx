import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useMemo, useState } from "react";
import { useStore } from "../../lib/store";
import { toIDR, ymKey } from "../../lib/format";
import TxItem from "../../components/TxItem";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { fs, ms } from "../../lib/responsive";

export default function Home() {
  const { txs, totals, deleteTx } = useStore();
  const [currentYM, setCurrentYM] = useState(ymKey(new Date()));
  const insets = useSafeAreaInsets();

  const monthList = useMemo(() => {
    const setYM = new Set(txs.map((t) => ymKey(t.date)));
    return Array.from(setYM).sort().reverse();
  }, [txs]);

  const data = useMemo(() => txs.filter((t) => ymKey(t.date) === currentYM), [txs, currentYM]);
  const t = totals(currentYM);
  const safeBalance = Math.max(0, t.balance);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: "#6b7280", fontSize: fs(12) }}>Saldo Bulan {currentYM}</Text>
          <Text style={{ fontSize: fs(26), fontWeight: "800", marginTop: 6 }}>
            {toIDR(safeBalance)}
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Badge label={`Masuk ${toIDR(t.in)}`} />
            <Badge label={`Keluar ${toIDR(t.out)}`} />
          </View>
          <FlatList
            data={monthList}
            horizontal
            keyExtractor={(x) => x}
            contentContainerStyle={{ gap: 8, marginTop: 12 }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tampilkan transaksi bulan ${item}`}
                onPress={() => setCurrentYM(item)}
                style={{
                  paddingVertical: ms(6),
                  paddingHorizontal: ms(10),
                  borderRadius: 999,
                  backgroundColor: item === currentYM ? "#111827" : "#e5e7eb",
                }}
              >
                <Text style={{ color: item === currentYM ? "white" : "#111827", fontWeight: "600", fontSize: fs(12) }}>{item}</Text>
              </Pressable>
            )}
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TxItem
              item={item}
              onDelete={(id) =>
                Alert.alert("Hapus transaksi?", "Tindakan ini tidak bisa dibatalkan.", [
                  { text: "Batal", style: "cancel" },
                  { text: "Hapus", style: "destructive", onPress: () => deleteTx(id) },
                ])
              }
            />
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: "#6b7280" }}>Belum ada transaksi.</Text>}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      </View>
    </SafeAreaView>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={{ backgroundColor: "#f3f4f6", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 }}>
      <Text style={{ fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
