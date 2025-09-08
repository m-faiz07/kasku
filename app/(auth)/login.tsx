import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { HttpError } from "../../lib/api";
import { useToast } from "../../lib/toast";

export default function Login() {
  const { login, loading } = useAuth();
  const { error, success } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    try {
      await login(email, password);
      success("Login berhasil");
      // Fallback navigate to tabs; root layout also handles redirect
      try { router.replace("/(tabs)"); } catch {}
    } catch (e: any) {
      const he = e as HttpError;
      if (he?.status === 404) return error("Email belum terdaftar");
      if (he?.status === 401) return error("Kata sandi salah");
      return error("Gagal Login", he?.message || "Terjadi kesalahan");
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
          <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
            <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 16 }}>Masuk</Text>
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", gap: 10 }}>
              <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <Pressable onPress={onSubmit} disabled={loading || !email || !password} style={{ backgroundColor: loading || !email || !password ? "#9ca3af" : "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 6 }}>
                <Text style={{ color: "white", fontWeight: "700" }}>{loading ? "Memproses..." : "Masuk"}</Text>
              </Pressable>
            </View>
            <Text style={{ textAlign: "center", color: "#6b7280", marginTop: 12 }}>Belum punya akun? Daftar dulu.</Text>
            <View style={{ alignItems: "center", marginTop: 6 }}>
              <Pressable onPress={() => require("expo-router").router.push("/(auth)/register")}>
                <Text style={{ fontWeight: "700" }}>Buat akun baru</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "700" }}>{label}</Text>
      <TextInput {...props} style={{ backgroundColor: "#f9fafb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: "#e5e7eb" }} />
    </View>
  );
}
