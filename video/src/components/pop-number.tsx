import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, SERIF } from "@/video/brand";

/** Deck-style number: glyphs rise on a drum, a stagger apart, serif face. */
export const Pop = ({
  value,
  delay = 0,
  stagger = 2,
  fontSize = 120,
  color = BRAND.text,
}: {
  value: string;
  delay?: number;
  stagger?: number;
  fontSize?: number;
  color?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span
      aria-label={value}
      style={{ display: "inline-flex", alignItems: "baseline", fontFamily: SERIF, fontSize, color, whiteSpace: "pre", fontVariantNumeric: "tabular-nums" }}
    >
      {[...value].map((ch, i) => {
        const p = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 18, stiffness: 160, mass: 0.8 } });
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 0.5}em) scale(${0.7 + 0.3 * p})`,
              filter: `blur(${(1 - p) * 6}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};
