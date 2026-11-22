import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "@/components/remocn/backdrop";
import { MACBOOK_PRO_14 } from "@/components/device";
import { BRAND, FONT_VARS, SANS } from "./brand";

const TITLE_FRAMES = 90;
const WALKTHROUGH_FRAMES = 1370;
export const LAUNCH_FRAMES = TITLE_FRAMES + WALKTHROUGH_FRAMES;

const SCREEN_BOX: React.CSSProperties = {
  position: "absolute",
  overflow: "hidden",
  left: `${(400 / 3824) * 100}%`,
  top: `${(300 / 2564) * 100}%`,
  width: `${((3424 - 400) / 3824) * 100}%`,
  height: `${((2264 - 300) / 2564) * 100}%`,
};

const CUES: [number, string][] = [
  [0, "Вход"],
  [153, "Главная"],
  [317, "Расписание"],
  [521, "Оценки"],
  [735, "Заявки"],
  [851, "Новая заявка"],
  [1049, "Уведомления"],
  [1248, "Профиль"],
];

const Title = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, TITLE_FRAMES - 12, TITLE_FRAMES - 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: "-0.03em", color: BRAND.text }}>
          Деканат будущего
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Showcase = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const caption = CUES.reduce((label, [at, text]) => (frame >= at ? text : label), CUES[0][1]);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, opacity }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 26,
            width: 900,
            transform: "translateX(-50%)",
            aspectRatio: `${3824} / ${2564}`,
          }}
        >
          <div style={{ ...SCREEN_BOX, background: "#f5f5f5" }}>
            <OffthreadVideo
              src={staticFile("clips/walkthrough.mp4")}
              muted
              playbackRate={1}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }}
            />
          </div>
          <Img
            src={staticFile(MACBOOK_PRO_14.frame)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 27,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 600, color: BRAND.text }}>{caption}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Launch = () => (
  <AbsoluteFill style={{ ...FONT_VARS, background: BRAND.bg, fontFamily: SANS }}>
    <Backdrop
      fill={
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `radial-gradient(ellipse at 50% 30%, ${BRAND.accent}0d 0%, ${BRAND.bg} 62%)`,
          }}
        />
      }
    />
    <Sequence from={0} durationInFrames={TITLE_FRAMES}>
      <Title />
    </Sequence>
    <Sequence from={TITLE_FRAMES} durationInFrames={WALKTHROUGH_FRAMES}>
      <Showcase />
    </Sequence>
  </AbsoluteFill>
);
