import { useState } from "react";
import { View, Text, TextInput, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { fs, ms } from "../../lib/responsive";
import { useToast } from "../../lib/toast";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { getBaseUrl, api } from "../../lib/api";

export default function ProfileScreen() {
  const { user, updateProfile, logout, loading, refreshMe, changePassword, changeEmail } = useAuth();
  const [name, setName] = useState<string>(user?.name || "");
  const { success, error } = useToast();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [email, setEmail] = useState<string>(user?.email || "");
  const [emailPwd, setEmailPwd] = useState("");
  const insets = useSafeAreaInsets();

  const onSave = async () => {
    try {
      const trimmed = name.trim();
      if (!trimmed) return;
      await updateProfile(trimmed);
      success("Profil diperbarui");
    } catch (e: any) {
      error("Gagal menyimpan", e?.message);
    }
  };

  const onLogout = async () => {
    await logout();
    success("Logout berhasil");
  };

  const onPickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return error("Izin ditolak", "Tidak bisa mengakses galeri");
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      const mime = asset.mimeType || "image/jpeg";
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const dataUrl = `data:${mime};base64,${base64}`;
      const out = await api.uploadAvatar(dataUrl);
      success("Foto profil diperbarui");
      await refreshMe();
    } catch (e: any) {
      error("Gagal mengunggah", e?.message);
    }
  };

  const onChangePassword = async () => {
    try {
      if (!oldPwd || !newPwd) return;
      await changePassword(oldPwd, newPwd);
      setOldPwd(""); setNewPwd("");
      success("Password diubah");
    } catch (e: any) {
      error("Gagal ubah password", e?.message);
    }
  };

  const onChangeEmail = async () => {
    try {
      if (!email || !emailPwd) return;
      await changeEmail(email.trim(), emailPwd);
      setEmailPwd("");
      success("Email diperbarui");
    } catch (e: any) {
      error("Gagal ubah email", e?.message);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View style={{ width: "100%", maxWidth: 720, alignSelf: "center", gap: 12 }}>
            <Text style={{ fontSize: fs(22), fontWeight: "800", marginBottom: 8 }}>Profil</Text>

            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", gap: 10 }}>
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <Avatar uri={user?.avatar} />
                <Pressable onPress={onPickAvatar} style={{ marginTop: 8, backgroundColor: "#111827", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                  <Text style={{ color: "white", fontWeight: "700" }}>Ubah Foto</Text>
                </Pressable>
              </View>
              <Field label="Email">
                <Text style={{ color: "#111827", fontSize: fs(14) }}>{user?.email || "-"}</Text>
              </Field>
              <Field label="Nama">
                <TextInput
                  placeholder="Nama"
                  value={name}
                  onChangeText={setName}
                  style={{ backgroundColor: "#f9fafb", borderRadius: 10, paddingHorizontal: ms(12), paddingVertical: ms(12), borderWidth: 1, borderColor: "#e5e7eb" }}
                />
              </Field>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Simpan perubahan profil"
                onPress={onSave}
                disabled={loading || !name.trim()}
                style={{ backgroundColor: loading || !name.trim() ? "#9ca3af" : "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 6 }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>{loading ? "Memproses..." : "Simpan"}</Text>
              </Pressable>
            </View>

            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", gap: 10 }}>
              <Text style={{ fontWeight: "700", fontSize: fs(14) }}>Ubah Password</Text>
              <Field label="Password saat ini">
                <TextInput value={oldPwd} onChangeText={setOldPwd} secureTextEntry placeholder="Password lama" style={{ backgroundColor: "#f9fafb", borderRadius: 10, paddingHorizontal: ms(12), paddingVertical: ms(12), borderWidth: 1, borderColor: "#e5e7eb" }} />
              </Field>
              <Field label="Password baru">
                <TextInput value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholder="Min 6 karakter" style={{ backgroundColor: "#f9fafb", borderRadius: 10, paddingHorizontal: ms(12), paddingVertical: ms(12), borderWidth: 1, borderColor: "#e5e7eb" }} />
              </Field>
              <Pressable accessibilityRole="button" accessibilityLabel="Ubah password" onPress={onChangePassword} disabled={!oldPwd || !newPwd} style={{ backgroundColor: !oldPwd || !newPwd ? "#9ca3af" : "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 6 }}>
                <Text style={{ color: "white", fontWeight: "700" }}>Simpan Password</Text>
              </Pressable>
            </View>

            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", gap: 10 }}>
              <Text style={{ fontWeight: "700", fontSize: fs(14) }}>Ubah Email</Text>
              <Field label="Email baru">
                <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="nama@kampus.ac.id" style={{ backgroundColor: "#f9fafb", borderRadius: 10, paddingHorizontal: ms(12), paddingVertical: ms(12), borderWidth: 1, borderColor: "#e5e7eb" }} />
              </Field>
              <Field label="Password">
                <TextInput value={emailPwd} onChangeText={setEmailPwd} secureTextEntry placeholder="Password saat ini" style={{ backgroundColor: "#f9fafb", borderRadius: 10, paddingHorizontal: ms(12), paddingVertical: ms(12), borderWidth: 1, borderColor: "#e5e7eb" }} />
              </Field>
              <Pressable accessibilityRole="button" accessibilityLabel="Ubah email" onPress={onChangeEmail} disabled={!email || !emailPwd} style={{ backgroundColor: !email || !emailPwd ? "#9ca3af" : "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 6 }}>
                <Text style={{ color: "white", fontWeight: "700" }}>Simpan Email</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
          <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar dari akun"
              onPress={onLogout}
              style={{ backgroundColor: "#dc2626", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Keluar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "700", fontSize: fs(14) }}>{label}</Text>
      {children}
    </View>
  );
}

function Avatar({ uri }: { uri?: string }) {
  let fullUri: string | undefined = uri;
  if (uri && uri.startsWith("/")) {
    fullUri = `${getBaseUrl()}${uri}`;
  }
  return (
    <View style={{ width: 100, height: 100, borderRadius: 50, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
      {fullUri ? (
        <Image source={{ uri: fullUri }} style={{ width: 100, height: 100 }} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#6b7280", fontWeight: "700" }}>No Photo</Text>
        </View>
      )}
    </View>
  );
}
