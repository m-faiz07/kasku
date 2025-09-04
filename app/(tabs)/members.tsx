import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useClassStore } from "../../lib/classStore";

type Row = {
  id: string;
  name: string;
  nim?: string;
  active: boolean;
};

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { members, addMember, updateMember, removeMember } = useClassStore();

  const [name, setName] = useState("");
  const [nim, setNim] = useState("");

  const data: Row[] = useMemo(() => members, [members]);

  const onAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMember(trimmed, nim.trim() || undefined);
    setName("");
    setNim("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 12 }}>Anggota</Text>

        <View style={{ backgroundColor: "white", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontWeight: "700", marginBottom: 8 }}>Tambah Anggota</Text>
          <TextInput
            placeholder="Nama (wajib)"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#6b7280"
            style={{ backgroundColor: "#f9fafb", color: "#111827", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb" }}
          />
          <TextInput
            placeholder="NIM (opsional)"
            value={nim}
            onChangeText={setNim}
            placeholderTextColor="#6b7280"
            style={{ backgroundColor: "#f9fafb", color: "#111827", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" }}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Tambah anggota" disabled={!name.trim()} onPress={onAdd} style={{ backgroundColor: name.trim() ? "#111827" : "#9ca3af", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ color: "white", fontWeight: "700" }}>Tambah</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 16, marginBottom: 10, backgroundColor: "white", borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontWeight: "700" }}>{item.name}</Text>
                {!!item.nim && <Text style={{ color: "#6b7280" }}>{item.nim}</Text>}
                <View style={{ marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: item.active ? "#d1fae5" : "#fee2e2" }}>
                  <Text style={{ color: item.active ? "#065f46" : "#991b1b", fontWeight: "700", fontSize: 12 }}>{item.active ? "Aktif" : "Nonaktif"}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.active ? "Arsipkan anggota" : "Aktifkan anggota"}
                  onPress={() => updateMember(item.id, { active: !item.active })}
                  style={{ backgroundColor: "#111827", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>{item.active ? "Arsipkan" : "Aktifkan"}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Hapus anggota"
                  onPress={() => removeMember(item.id)}
                  style={{ backgroundColor: "#dc2626", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Hapus</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: "#6b7280", marginTop: 12 }}>Belum ada anggota. Tambahkan anggota dulu.</Text>}
      />
    </SafeAreaView>
  );
}


