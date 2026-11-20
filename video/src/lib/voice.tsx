import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";

/** Demo plays at normal speed while the voice talks, then its tail is sped up so
 *  the speed-up ends just before the result card (or the clip's end). */
export type Plan = { t1: number; t2: number; rate: number; dur: number; seconds: number };
export const plan = (dur: number, voiceSec: number, cardAt?: number): Plan => {
  const t2 = cardAt === undefined ? dur - 0.3 : cardAt - 0.4;
  const t1 = voiceSec + 0.4;
  if (t2 - t1 < 1.2) return { t1: dur, t2: dur, rate: 1, dur, seconds: Math.max(dur, voiceSec + 0.3) };
  const rate = Math.min(12, Math.max(2, (t2 - t1) / 2.8));
  return { t1, t2, rate, dur, seconds: t1 + (t2 - t1) / rate + (dur - t2) };
};

/** Scene lengths in seconds keyed by scene id → frame offsets and the total. */
export const timeline = (seconds: Record<number, number>, fps = 30) => {
  const FRAMES = Object.fromEntries(Object.entries(seconds).map(([k, v]) => [k, Math.round(v * fps)])) as Record<number, number>;
  const STARTS: Record<number, number> = {};
  let acc = 0;
  for (const id of Object.keys(FRAMES).map(Number)) {
    STARTS[id] = acc;
    acc += FRAMES[id];
  }
  return { FRAMES, STARTS, total: acc };
};

/** One narrated scene: fades in and out and carries its piece of the voice track. */
export const Scene = ({ total, audio, children }: { total: number; audio?: string; children: React.ReactNode }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, total - 8, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity }}>
      {audio && <Audio src={staticFile(audio)} />}
      {children}
    </AbsoluteFill>
  );
};
