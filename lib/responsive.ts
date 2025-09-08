import { Dimensions, PixelRatio } from "react-native";

// Base iPhone X guideline sizes
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function screen() {
  const { width, height } = Dimensions.get("window");
  return { width, height };
}

export function hs(size: number) {
  const { width } = screen();
  return Math.round((width / BASE_WIDTH) * size);
}

export function vs(size: number) {
  const { height } = screen();
  return Math.round((height / BASE_HEIGHT) * size);
}

// moderate scale (adjusts mostly by width)
export function ms(size: number, factor = 0.5) {
  const scaled = hs(size);
  return Math.round(size + (scaled - size) * factor);
}

// font scale with respect to device and user settings
export function fs(size: number, factor = 0.5) {
  const scaled = ms(size, factor);
  // Respect user font scaling; do not downscale below 1x
  const fontScale = PixelRatio.getFontScale() || 1;
  return Math.round(scaled * Math.max(1, fontScale));
}

export function isTablet() {
  const { width, height } = screen();
  const minDim = Math.min(width, height);
  return minDim >= 768;
}

