import { Slot, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { useClassStore } from "../lib/classStore";
import { useAuth } from "../lib/auth";
import AnimatedSplash from "../components/AnimatedSplash";
import ToastHost from "../components/Toast";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const auth = useAuth();
  const syncTx = useStore((s) => s.syncAll);
  const syncMembers = useClassStore((s) => s.syncMembers);
  const syncDues = useClassStore((s) => s.syncDuesAmount);
  const syncBills = useClassStore((s) => s.syncBills);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hydrate auth first
    auth.hydrate();
  }, []);

  // Redirect based on auth state and current group
  useEffect(() => {
    const inAuth = segments[0] === "(auth)";
    if (!auth.hydrated) return;
    if (!auth.token && !inAuth) {
      router.replace("/(auth)/login");
    } else if (auth.token && inAuth) {
      router.replace("/(tabs)");
      // After login, sync data
      syncTx();
      syncMembers();
      syncDues();
      syncBills();
    } else if (auth.token) {
      // Already logged in, ensure data is fresh on app start
      syncTx(); syncMembers(); syncDues(); syncBills();
    }
  }, [auth.token, auth.hydrated, segments.join("/")]);

  // Hide splash after auth hydration + small delay
  useEffect(() => {
    if (!auth.hydrated) return;
    const t = setTimeout(() => setShowSplash(false), 700);
    return () => clearTimeout(t);
  }, [auth.hydrated]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* iOS: otomatis menghindari notch, Android: handle status bar insets */}
        <StatusBar style="dark" />
        <Slot />
        {/* Global toast notifications */}
        <ToastHost />
        <AnimatedSplash visible={showSplash} onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
