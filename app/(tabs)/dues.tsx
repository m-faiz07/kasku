import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, Modal, Platform, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { fs, hs, vs, ms } from "../../lib/responsive";
import { useClassStore } from "../../lib/classStore";
import { ymKey } from "../../lib/format";
// Custom wheel-like pickers tanpa dependensi eksternal

const parseRp = (s: string) => Number((s || "0").replace(/[^\d]/g, ""));

function Check({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={checked ? "Batalkan pilihan" : "Pilih tagihan"}
      style={{
        width: hs(20),
        height: hs(20),
        borderRadius: 6,
        borderWidth: 2,
        borderColor: checked ? "#111827" : "#9ca3af",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: checked ? "#111827" : "transparent",
      }}
    >
      {checked ? <Text style={{ color: "white", fontWeight: "800" }}>✓</Text> : null}
    </Pressable>
  );
}

export default function DuesScreen() {
  const insets = useSafeAreaInsets();
  const { duesAmount, setDuesAmount, generateBills, bulkMarkPaid } = useClassStore();
  const bills = useClassStore((s) => s.bills);
  const members = useClassStore((s) => s.members);

  const [amountInput, setAmountInput] = useState(String(duesAmount || 0));
  const [ym, setYm] = useState(ymKey(new Date()));
  const [pickerDate, setPickerDate] = useState<Date>(() => new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [tempYear, setTempYear] = useState<number>(() => new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const MONTH_NAMES = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  useEffect(() => {
    setAmountInput(String(duesAmount || 0));
  }, [duesAmount]);

  const billsForCurrentMonth = useMemo(
    () =>
      bills
        .filter((b) => b.ym === ym)
        .map((b) => ({ ...b, member: members.find((m) => m.id === b.memberId) }))
        .filter((b) => !!b.member),
    [bills, members, ym]
  );

  const counts = useMemo(() => {
    const total = billsForCurrentMonth.length;
    const unpaid = billsForCurrentMonth.filter((b) => b.status === "UNPAID").length;
    const paid = billsForCurrentMonth.filter((b) => b.status === "PAID").length;
    return { total, unpaid, paid };
  }, [billsForCurrentMonth]);

  const toggleSelect = (memberId: string) => {
    setSelection((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const selectAllUnpaid = () => {
    const next: Record<string, boolean> = { ...selection };
    billsForCurrentMonth.forEach((b) => {
      if (b.status === "UNPAID") next[b.memberId] = true;
    });
    setSelection(next);
  };

  const clearSelection = () => setSelection({});

  const onSaveAmount = () => {
    const parsed = parseRp(amountInput);
    setDuesAmount(parsed);
  };

  const onGenerate = () => {
    const nextYm = ymKey(pickerDate);
    setYm(nextYm);
    generateBills(nextYm);
  };

  const onBulkPaid = () => {
    const ids = billsForCurrentMonth
      .filter((b) => b.status === "UNPAID" && selection[b.memberId])
      .map((b) => b.memberId);
    if (ids.length === 0) return;
    bulkMarkPaid(ids, ym);
    clearSelection();
  };

  const ITEM_HEIGHT = Math.round(vs(44));
  function WheelColumn({ values, value, onChange, labelFor }: { values: string[]; value: string; onChange: (v: string) => void; labelFor?: (v: string) => string }) {
    const initialIndex = Math.max(0, values.findIndex((d) => d === value));
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const v = values[Math.min(values.length - 1, Math.max(0, idx))];
          if (v && v !== value) onChange(v);
        }}
        style={{ height: ITEM_HEIGHT * 5 }}
      >
        <View style={{ height: ITEM_HEIGHT * 2 }} />
        {values.map((d) => (
          <View key={d} style={{ height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: fs(18), color: d === value ? "#111827" : "#9ca3af", fontWeight: d === value ? "800" : "600" }}>{labelFor ? labelFor(d) : d}</Text>
          </View>
        ))}
        <View style={{ height: ITEM_HEIGHT * 2 }} />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }} edges={["top", "left", "right"]}>
      <FlatList
        data={billsForCurrentMonth}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: fs(20), fontWeight: "800", marginBottom: 12 }}>Iuran</Text>

            <View style={{ backgroundColor: "white", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontWeight: "700", marginBottom: 8, fontSize: fs(14) }}>Nominal Iuran per Bulan</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  placeholder="Contoh: 20000"
                  inputMode="numeric"
                  value={amountInput}
                  onChangeText={setAmountInput}
                  style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, paddingHorizontal: ms(12), paddingVertical: ms(10) }}
                />
                <Pressable accessibilityRole="button" accessibilityLabel="Simpan nominal iuran" onPress={onSaveAmount} style={{ backgroundColor: "#111827", paddingVertical: ms(10), paddingHorizontal: ms(14), borderRadius: 10 }}>
                  <Text style={{ color: "white", fontWeight: "700" }}>Simpan</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ backgroundColor: "white", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontWeight: "700", marginBottom: 8 }}>Bulan</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Pressable onPress={() => { const d = pickerDate; setTempYear(d.getFullYear()); setTempMonth(String(d.getMonth()+1).padStart(2, "0")); setShowPicker(true); }} style={{ flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, paddingHorizontal: ms(12), paddingVertical: ms(12) }}>
                  <Text style={{ fontWeight: "700", color: "#111827" }}>{`${MONTH_NAMES[pickerDate.getMonth()]} ${pickerDate.getFullYear()}`}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Generate tagihan bulan ini" onPress={onGenerate} style={{ backgroundColor: "#111827", paddingVertical: ms(10), paddingHorizontal: ms(14), borderRadius: 10 }}>
                  <Text style={{ color: "white", fontWeight: "700" }}>Generate Tagihan</Text>
                </Pressable>
              </View>
              {(
                <Modal transparent visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
                  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", padding: 20 }}>
                    <View style={{ backgroundColor: "white", borderRadius: 16, padding: 12 }}>
                      <Text style={{ fontWeight: "700", marginBottom: 8, color: "#111827" }}>Pilih Bulan</Text>
                      {Platform.OS === "ios" ? (
                        <View style={{ position: "relative", paddingHorizontal: 12 }}>
                          <View style={{ flexDirection: "row", gap: 16 }}>
                            <View style={{ flex: 1 }}>
                              <WheelColumn
                                values={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))}
                                value={tempMonth}
                                onChange={(v) => setTempMonth(v)}
                                labelFor={(v) => MONTH_NAMES[Number(v) - 1]}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <WheelColumn
                                values={(() => { const base = new Date().getFullYear(); return [base - 2, base - 1, base, base + 1, base + 2].map(String); })()}
                                value={String(tempYear)}
                                onChange={(v) => setTempYear(Number(v))}
                              />
                            </View>
                          </View>
                          <View pointerEvents="none" style={{ position: "absolute", left: 12, right: 12, top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT, borderWidth: 1, borderColor: "#111827", borderRadius: 10, backgroundColor: "transparent" }} />
                        </View>
                      ) : (
                        <View>
                          <View style={{ marginBottom: 10 }}>
                            <Text style={{ color: "#6b7280", marginBottom: 6, fontSize: fs(14) }}>Tahun</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                              {(() => {
                                const base = new Date().getFullYear();
                                const years = [base - 2, base - 1, base, base + 1, base + 2];
                                return years.map((y) => (
                                  <Pressable key={y} onPress={() => setTempYear(y)} style={{ paddingVertical: ms(8), paddingHorizontal: ms(12), borderRadius: 8, backgroundColor: tempYear === y ? "#111827" : "#e5e7eb" }}>
                                    <Text style={{ color: tempYear === y ? "white" : "#111827", fontWeight: "700", fontSize: fs(14) }}>{y}</Text>
                                  </Pressable>
                                ));
                              })()}
                            </View>
                          </View>
                          <View>
                            <Text style={{ color: "#6b7280", marginBottom: 6 }}>Bulan</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m, idx) => (
                                <Pressable key={m} onPress={() => setTempMonth(m)} style={{ paddingVertical: ms(8), paddingHorizontal: ms(12), borderRadius: 8, backgroundColor: tempMonth === m ? "#111827" : "#e5e7eb" }}>
                                  <Text style={{ color: tempMonth === m ? "white" : "#111827", fontWeight: "700", fontSize: fs(14) }}>{MONTH_NAMES[idx]}</Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        </View>
                      )}
                      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                        <Pressable accessibilityRole="button" accessibilityLabel="Tutup pemilih bulan" onPress={() => setShowPicker(false)} style={{ paddingVertical: ms(10), paddingHorizontal: ms(14) }}>
                          <Text style={{ color: "#6b7280", fontWeight: "700" }}>Batal</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Selesai memilih bulan"
                          onPress={() => {
                            const normalized = new Date(Number(tempYear), Number(tempMonth) - 1, 1);
                            setPickerDate(normalized);
                            setYm(ymKey(normalized));
                            setShowPicker(false);
                          }}
                          style={{ backgroundColor: "#111827", paddingVertical: ms(10), paddingHorizontal: ms(14), borderRadius: 10 }}
                        >
                          <Text style={{ color: "white", fontWeight: "700" }}>Selesai</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: "#6b7280" }}>Ringkasan: {counts.total} total · {counts.unpaid} UNPAID · {counts.paid} PAID</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Pilih semua tagihan belum lunas" onPress={selectAllUnpaid} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#e5e7eb" }}>
                <Text style={{ fontWeight: "700", color: "#111827" }}>Pilih semua Belum Lunas</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 16, marginBottom: 10, backgroundColor: "white", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center" }}>
            {item.status === "UNPAID" ? (
              <View style={{ marginRight: 12 }}>
                <Check checked={!!selection[item.memberId]} onPress={() => toggleSelect(item.memberId)} />
              </View>
            ) : (
              <View style={{ width: hs(20), height: hs(20), marginRight: 12 }} />
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700" }}>{item.member?.name || "(Tidak diketahui)"}</Text>
              <Text style={{ color: "#6b7280", marginTop: 2 }}>{item.ym}</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <View style={{ alignSelf: "flex-end", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: item.status === "PAID" ? "#d1fae5" : item.status === "WAIVED" ? "#e0e7ff" : "#fee2e2" }}>
                <Text style={{ color: item.status === "PAID" ? "#065f46" : item.status === "WAIVED" ? "#3730a3" : "#991b1b", fontWeight: "700", fontSize: fs(12) }}>
                  {item.status === "PAID" ? "LUNAS" : item.status === "WAIVED" ? "DIBEBASKAN" : "BELUM LUNAS"}
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ textAlign: "center", color: "#6b7280" }}>
              Belum ada tagihan untuk bulan ini. Gunakan tombol "Generate Tagihan".
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tandai lunas untuk item terpilih"
              onPress={onBulkPaid}
              disabled={!billsForCurrentMonth.some((b) => b.status === "UNPAID" && selection[b.memberId])}
              style={{ backgroundColor: billsForCurrentMonth.some((b) => b.status === "UNPAID" && selection[b.memberId]) ? "#111827" : "#9ca3af", paddingVertical: ms(12), borderRadius: 10, alignItems: "center", marginTop: 4 }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Tandai Lunas (Massal)</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}
