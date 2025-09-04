// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tint.active,
        tabBarInactiveTintColor: tint.inactive,
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },
        tabBarStyle: { height: 60 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: icon("home-outline") }}
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
        options={{ title: "Members", tabBarIcon: icon("people-outline") }}
      />
        
      <Tabs.Screen
        name="stats"
        options={{ title: "Statistik", tabBarIcon: icon("stats-chart-outline") }}
      />
    </Tabs>
  );
}
