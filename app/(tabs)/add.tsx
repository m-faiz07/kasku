import { View, Text, TextInput, Pressable, Alert, Platform, KeyboardAvoidingView, ScrollView, TextInputProps } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { useStore } from "../../lib/store";
import { toIDR } from "../../lib/format";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function Add() {
  const { addTx, totals } = useStore();
  const [type, setType] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const insets = useSafeAreaInsets();

  const parsed = Number((amount || "0").replace(/[^\d]/g, ""));
  const pretty = toIDR(parsed || 0);

  const global = totals();
  const available = Math.max(0, global.in - global.out);
  const overLimit = type === "out" && parsed > available;

  const onSave = () => {
    if (parsed <= 0) {
      return Alert.alert("Nominal belum benar", "Masukkan nominal > 0");
    }
    if (overLimit) {
      return Alert.alert("Saldo tidak cukup", `Pengeluaran melebihi saldo. Sisa: ${toIDR(available)}`);
    }

    addTx({ type, amount: parsed, category: category || "Umum", note, date: date.toISOString() });
    setAmount(""); setCategory(""); setNote("");
    Alert.alert("Tersimpan", "Transaksi ditambahkan");
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Segment value={type} onChange={setType} />

          <Field label="Nominal" keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="cth: 50000" />
          <Text style={{ color: "#6b7280", marginTop: -6 }}>Pratinjau: {pretty}</Text>

          <Text style={{ marginTop: -2, color: overLimit ? "#dc2626" : "#6b7280", fontWeight: overLimit ? "700" as const : "400" }}>
            Sisa saldo: {toIDR(available)}
            {overLimit ? " — nominal melebihi saldo" : ""}
          </Text>

          <Field label="Kategori" value={category} onChangeText={setCategory} placeholder="Kas Kelas / Makan" />
          <Field label="Catatan" value={note} onChangeText={setNote} placeholder="opsional" />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pilih tanggal transaksi"
            onPress={() => setShowPicker(true)}
            style={{ backgroundColor: "white", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" }}
          >
            <Text style={{ fontWeight: "700" }}>Tanggal</Text>
            <Text style={{ color: "#111827", marginTop: 6 }}>{date.toLocaleString("id-ID")}</Text>
          </Pressable>

          {showPicker && (
            <DateTimePicker value={date} mode="date" onChange={(_, d) => { setShowPicker(false); if (d) setDate(d); }} />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={overLimit ? "Saldo tidak cukup" : "Simpan transaksi"}
            onPress={onSave}
            disabled={overLimit}
            style={{
              backgroundColor: overLimit ? "#9ca3af" : "#111827",
              padding: 14,
              borderRadius: 12,
              opacity: overLimit ? 0.9 : 1,
            }}
          >
            <Text style={{ textAlign: "center", color: "white", fontWeight: "700" }}>
              {overLimit ? "Saldo tidak cukup" : "Simpan"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = TextInputProps & { label: string };

function Field(props: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "700" }}>{props.label}</Text>
      <TextInput
        {...props}
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      />
    </View>
  );
}

function Segment({ value, onChange }: { value: "in" | "out"; onChange: (v: "in" | "out") => void }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#e5e7eb", borderRadius: 12, padding: 4 }}>
      {(["in", "out"] as const).map((v) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityLabel={v === "in" ? "Pilih transaksi masuk" : "Pilih transaksi keluar"}
          onPress={() => onChange(v)}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: value === v ? "#111827" : "transparent",
          }}>
          <Text style={{ textAlign: "center", color: value === v ? "white" : "#111827", fontWeight: "700" }}>
            {v === "in" ? "Masuk" : "Keluar"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

