import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useStore } from "../lib/store";
import { useClassStore } from "../lib/classStore";

export default function RootLayout() {
  const syncTx = useStore((s) => s.syncAll);
  const syncMembers = useClassStore((s) => s.syncMembers);
  const syncDues = useClassStore((s) => s.syncDuesAmount);
  const syncBills = useClassStore((s) => s.syncBills);

  useEffect(() => {
    // Hydrate initial data from server
    syncTx();
    syncMembers();
    syncDues();
    syncBills();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* iOS: otomatis menghindari notch, Android: handle status bar insets */}
        <StatusBar style="dark" />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
