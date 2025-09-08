import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { fs, ms } from "../lib/responsive";

export default function NotFoundScreen() {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: ms(24) }}>
            <Text style={{ fontSize: fs(18), fontWeight: "700", marginBottom: 8 }}>Halaman tidak ditemukan</Text>
            <Text style={{ color: "#6b7280", marginBottom: 16, fontSize: fs(12) }}>
                Rute yang kamu buka tidak ada.
            </Text>
            <Link href="/(tabs)" asChild>
                <Pressable /* ... */ style={{ paddingVertical: ms(10), paddingHorizontal: ms(14), borderRadius: 10, backgroundColor: "#e5e7eb" }}>
                    <Text style={{ fontSize: fs(14), fontWeight: "700" }}>Kembali ke Home</Text>
                </Pressable>
            </Link>
        </View>
    );
}
