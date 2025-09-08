// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ms, fs, isTablet } from "../../lib/responsive";

const tint = {
  active: "#111827",
  inactive: "#9ca3af",
};

function icon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const baseHeight = ms(54, 0.4);
  const bottomInset = Math.max(insets.bottom, 0);
  const tabBarHeight = baseHeight + bottomInset;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tint.active,
        tabBarInactiveTintColor: tint.inactive,
        tabBarLabelStyle: { fontSize: fs(11), marginBottom: isTablet() ? 2 : 4 },
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: bottomInset > 0 ? bottomInset : (isTablet() ? 6 : 2),
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Beranda", tabBarIcon: icon("home-outline") }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: "Tambah", tabBarIcon: icon("add-circle-outline") }}
      />
      <Tabs.Screen
        name="dues"
        options={{ title: "Iuran", tabBarIcon: icon("cash-outline") }}
      />
      <Tabs.Screen
        name="members"
        options={{ title: "Anggota", tabBarIcon: icon("people-outline") }}
      />
        
      <Tabs.Screen
        name="stats"
        options={{ title: "Statistik", tabBarIcon: icon("stats-chart-outline") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profil", tabBarIcon: icon("person-circle-outline") }}
      />
    </Tabs>
  );
}
