import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, View, Text } from "react-native";

export default function AnimatedSplash({ visible, onFinish }: { visible: boolean; onFinish?: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const bg = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible && !done) {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 450, delay: 100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start(() => { setDone(true); onFinish?.(); });
    }
  }, [visible]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bg, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(bg, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  if (done) return null;

  const bgColor = bg.interpolate({ inputRange: [0, 1], outputRange: ["#111827", "#0f172a"] });
  const accent = bg.interpolate({ inputRange: [0, 1], outputRange: ["#22d3ee", "#a78bfa"] });

  return (
    <Animated.View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: bgColor, alignItems: "center", justifyContent: "center", zIndex: 9999, opacity }}>
      <View style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "#ffffff10" }} />
      <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
        <Image source={require("../assets/images/splash-icon.png")} style={{ width: 120, height: 120, borderRadius: 24 }} />
        <Animated.Text style={{ color: accent as any, fontWeight: "800", marginTop: 18, fontSize: 22 }}>Kasku</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}
