import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";

export const BRAND = {
  bg: "#ffffff",
  card: "#ffffff",
  border: "rgba(0,0,0,0.06)",
  shadow: "0 0 0 1px rgba(0,0,0,0.06), 0 3px 3px -1.5px rgba(0,0,0,0.06), 0 6px 6px -3px rgba(0,0,0,0.06)",
  text: "#171717",
  muted: "#737373",
  accent: "#4F39F6",
};

const sans = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["cyrillic", "latin"] });
const serif = loadSerif("normal", { weights: ["400"], subsets: ["cyrillic", "latin"] });

export const SANS = `${sans.fontFamily}, -apple-system, sans-serif`;
export const SERIF = `${serif.fontFamily}, Georgia, serif`;

export const FONT_VARS = {
  "--font-geist-sans": SANS,
  "--font-geist-mono": "ui-monospace, SFMono-Regular, monospace",
} as React.CSSProperties;
