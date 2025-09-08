import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, FlatList, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { fs, ms } from "../../lib/responsive";
import { useClassStore } from "../../lib/classStore";
import { Ionicons } from "@expo/vector-icons";

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
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
              <Text style={{ fontSize: fs(20), fontWeight: "800", marginBottom: 12 }}>Anggota</Text>

              <View style={{ backgroundColor: "white", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" }}>
                <Text style={{ fontWeight: "700", marginBottom: 10, fontSize: fs(14) }}>Tambah Anggota</Text>
                <View style={{ gap: 10 }}>
                  <TextInput
                    placeholder="Nama (wajib)"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#6b7280"
                    style={{ backgroundColor: "#f9fafb", color: "#111827", borderRadius: 10, paddingHorizontal: ms(12), paddingVertical: ms(14), borderWidth: 1, borderColor: "#e5e7eb" }}
                  />
                  <TextInput
                    placeholder="NIM (opsional)"
                    value={nim}
                    onChangeText={setNim}
                    placeholderTextColor="#6b7280"
                    style={{ backgroundColor: "#f9fafb", color: "#111827", borderRadius: 10, paddingHorizontal: ms(12), paddingVertical: ms(14), borderWidth: 1, borderColor: "#e5e7eb" }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tambah anggota"
                    disabled={!name.trim()}
                    onPress={onAdd}
                    style={{ backgroundColor: name.trim() ? "#111827" : "#9ca3af", height: ms(44), borderRadius: 12, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: fs(14) }}>Tambah</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
              <View style={{ backgroundColor: "white", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: "700", fontSize: fs(16) }}>{item.name}</Text>
                    {!!item.nim && <Text style={{ color: "#6b7280", marginTop: 2 }}>{item.nim}</Text>}
                    <View style={{ marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: item.active ? "#d1fae5" : "#fee2e2" }}>
                      <Text style={{ color: item.active ? "#065f46" : "#991b1b", fontWeight: "700", fontSize: fs(12) }}>{item.active ? "Aktif" : "Nonaktif"}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={item.active ? "Arsipkan anggota" : "Aktifkan anggota"}
                      onPress={() => updateMember(item.id, { active: !item.active })}
                      style={{ backgroundColor: "#111827", height: ms(40), paddingHorizontal: 14, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
                    >
                      <Ionicons name={item.active ? "archive-outline" : "checkmark-circle-outline"} size={ms(18)} color="#fff" />
                      <Text style={{ color: "white", fontWeight: "700", fontSize: fs(14) }}>{item.active ? "Arsipkan" : "Aktifkan"}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Hapus anggota"
                      onPress={() => removeMember(item.id)}
                      style={{ backgroundColor: "#dc2626", height: ms(40), paddingHorizontal: 14, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
                    >
                      <Ionicons name="trash-outline" size={ms(18)} color="#fff" />
                      <Text style={{ color: "white", fontWeight: "700", fontSize: fs(14) }}>Hapus</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: ms(2, 0.2) }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
              <Text style={{ textAlign: "center", color: "#6b7280" }}>Belum ada anggota. Tambahkan anggota dulu.</Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}


