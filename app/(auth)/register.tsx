import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { HttpError } from "../../lib/api";

export default function Register() {
  const { register, loading } = useAuth();
  const { error, success } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    try {
      await register(email, password, name);
      success("Akun berhasil dibuat");
    } catch (e: any) {
      const he = e as HttpError;
      if (he?.status === 409) return error("Email sudah terdaftar");
      return error("Gagal Daftar", he?.message || "Coba lagi");
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
          <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
            <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 16 }}>Daftar</Text>
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", gap: 10 }}>
              <Field label="Nama" value={name} onChangeText={setName} />
              <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <Pressable onPress={onSubmit} disabled={loading || !email || !password} style={{ backgroundColor: loading || !email || !password ? "#9ca3af" : "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 6 }}>
                <Text style={{ color: "white", fontWeight: "700" }}>{loading ? "Memproses..." : "Daftar"}</Text>
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
