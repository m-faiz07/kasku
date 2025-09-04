import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function NotFoundScreen() {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>Halaman tidak ditemukan</Text>
            <Text style={{ color: "#6b7280", marginBottom: 16 }}>
                Rute yang kamu buka tidak ada.
            </Text>
            <Link href="/(tabs)" asChild>
                <Pressable /* ... */>
                    <Text>Kembali ke Home</Text>
                </Pressable>
            </Link>
        </View>
    );
}