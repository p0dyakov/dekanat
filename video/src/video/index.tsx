import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { Backdrop } from "@/components/remocn/backdrop";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";
import { BlurOutUp } from "@/components/remocn/blur-out-up";
import { focusPull } from "@/components/remocn/focus-pull";
import { Device, MACBOOK_PRO_14 } from "@/components/device";
import { BRAND, FONT_VARS, SANS } from "./brand";

// Все клипы записаны вьюпортом 1536x1000 — то же соотношение, что у экрана
// MacBook Pro 14 в рамке (3024x1968, ~1.536), поэтому видео заполняет экран 1:1.
const RATE = 1.25;
const TRIM = 2.0; // срезаем прогруз страницы в начале каждого клипа
const seg = (sec: number) => Math.round(((sec - TRIM) / RATE) * 30);

const SCENES: { src: string; sec: number; caption: string }[] = [
  { src: "clips/c1-login.mp4", sec: 13.58, caption: "Вход в один клик — сразу дашборд" },
  { src: "clips/c2-schedule.mp4", sec: 14.63, caption: "Расписание: переносы, отмены и «окна»" },
  { src: "clips/c3-grades.mp4", sec: 15.13, caption: "Оценки, посещаемость и зимняя сессия" },
  { src: "clips/c4-requests.mp4", sec: 12.08, caption: "Справки и вопросы деканату со статусами" },
  { src: "clips/c4b-newreq.mp4", sec: 11.58, caption: "Новая заявка за полминуты" },
  { src: "clips/c5-notif.mp4", sec: 12.08, caption: "Уведомления об изменениях и дедлайнах" },
  { src: "clips/c5b-profile.mp4", sec: 13.08, caption: "Профиль и контакты деканата" },
];

const TITLE = 110;
const SHOWCASE = 50 + SCENES.reduce((a, s) => a + seg(s.sec), 0);
const T = 30;

export const LAUNCH_FRAMES = TITLE + SHOWCASE - T;

const Title = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [TITLE - 22, TITLE - 4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <SoftBlurIn text="Деканат будущего" fontSize={112} fontWeight={700} color={BRAND.text} blur={18} />
      </div>
    </AbsoluteFill>
  );
};

const useRise = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 26, mass: 1, stiffness: 90 } });
  return {
    opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
    transform: `perspective(1400px) translateY(${(1 - p) * 200}px) rotateX(${(1 - p) * 24}deg) scale(${0.88 + 0.12 * p})`,
  };
};

const LAPTOP_W = 900;

const Showcase = () => {
  const rise = useRise();
  let at = 50;
  return (
    <AbsoluteFill>
      {SCENES.map((s, i) => {
        const from = at;
        at += seg(s.sec);
        return (
          <Sequence key={i} from={from} durationInFrames={seg(s.sec)}>
            <SceneInner src={s.src} caption={s.caption} rise={i === 0 ? rise : undefined} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneInner = ({
  src,
  caption,
  rise,
}: {
  src: string;
  caption: string;
  rise?: { opacity: number; transform: string };
}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 7], [0.35, 1], { extrapolateRight: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 24,
          display: "flex",
          justifyContent: "center",
          opacity: (rise?.opacity ?? 1) * fade,
          transform: rise?.transform,
        }}
      >
        <Device
          spec={MACBOOK_PRO_14}
          src={src}
          playbackRate={RATE}
          startFrom={Math.round(TRIM * 24)}
          style={{ width: LAPTOP_W }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center" }}>
        <BlurOutUp text={caption} fontSize={38} fontWeight={600} color={BRAND.text} />
      </div>
    </>
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
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={TITLE}>
        <Title />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={linearTiming({ durationInFrames: T })} presentation={focusPull()} />
      <TransitionSeries.Sequence durationInFrames={SHOWCASE}>
        <Showcase />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
