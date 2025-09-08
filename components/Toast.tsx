import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../lib/toast";

function typeColor(type: "success" | "error" | "info") {
  switch (type) {
    case "success":
      return { bg: "#ecfdf5", fg: "#065f46", icon: "checkmark-circle-outline" as const };
    case "error":
      return { bg: "#fef2f2", fg: "#991b1b", icon: "alert-circle-outline" as const };
    default:
      return { bg: "#eef2ff", fg: "#3730a3", icon: "information-circle-outline" as const };
  }
}

export default function ToastHost() {
  const insets = useSafeAreaInsets();
  const { current, hide } = useToast();
  const y = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (current) {
      Animated.parallel([
        Animated.timing(y, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(y, { toValue: -30, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
  }, [current]);

  if (!current) return null;

  const palette = typeColor(current.type);

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 9999 }}>
      <Animated.View
        style={{
          transform: [{ translateY: y }],
          opacity,
          position: "absolute",
          left: 12,
          right: 12,
          top: insets.top + 10,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${current.type === "success" ? "Berhasil" : current.type === "error" ? "Kesalahan" : "Info"}. Ketuk untuk menutup.`}
          onPress={hide}
          style={{
            backgroundColor: palette.bg,
            borderColor: Platform.OS === "ios" ? "#e5e7eb" : palette.bg,
            borderWidth: 1,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name={palette.icon} size={18} color={palette.fg} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={{ color: palette.fg, fontWeight: "800" }}>{current.title}</Text>
              {!!current.message && (
                <Text style={{ color: palette.fg, marginTop: 2 }}>{current.message}</Text>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

