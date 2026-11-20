import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { Backdrop } from "@/components/remocn/backdrop";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";
import { BlurOutUp } from "@/components/remocn/blur-out-up";
import { focusPull } from "@/components/remocn/focus-pull";
import { MACBOOK_PRO_14, SCREEN_BOX } from "@/components/device";
import { BRAND, FONT_VARS, SANS } from "./brand";

// Клипы записаны вьюпортом 1512x982 @2x — 1:1 с вырезом экрана рамки
// MacBook Pro 14 (3024x1964), видео заполняет экран без кропа.
const RATE = 1.25;
const TRIM = 1.5; // срезаем статичное начало клипа (после settle_ms страница уже гидрирована)
const XFADE = 8; // кроссфейд между сценами, кадры
const seg = (sec: number) => Math.round(((sec - TRIM) / RATE) * 30);

const SCENES: { src: string; sec: number; caption: string }[] = [
  { src: "clips/c1-login.mp4", sec: 9.73, caption: "Вход в один клик — сразу дашборд" },
  { src: "clips/c2-schedule.mp4", sec: 12.43, caption: "Расписание: переносы, отмены и «окна»" },
  { src: "clips/c3-grades.mp4", sec: 10.3, caption: "Оценки, посещаемость и зимняя сессия" },
  { src: "clips/c4-requests.mp4", sec: 10.0, caption: "Справки и вопросы деканату со статусами" },
  { src: "clips/c4b-newreq.mp4", sec: 9.5, caption: "Новая заявка за полминуты" },
  { src: "clips/c5-notif.mp4", sec: 9.1, caption: "Уведомления об изменениях и дедлайнах" },
  { src: "clips/c5b-profile.mp4", sec: 10.0, caption: "Профиль и контакты деканата" },
];

const TITLE = 110;
const INTRO = 40;
const SHOWCASE = INTRO + SCENES.reduce((a, s) => a + seg(s.sec), 0);
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

const LAPTOP_W = 920;

/** Экранная область одного клипа: фейд-ин поверх предыдущей сцены. */
const ScreenClip = ({ src, first }: { src: string; first: boolean }) => {
  const frame = useCurrentFrame();
  const op = first ? 1 : interpolate(frame, [0, XFADE], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", overflow: "hidden", background: "#f5f5f5", opacity: op, ...SCREEN_BOX }}>
      <OffthreadVideo
        src={staticFile(src)}
        muted
        startFrom={Math.round(TRIM * 30)}
        playbackRate={RATE}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};

const Caption = ({ text }: { text: string }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, display: "flex", justifyContent: "center" }}>
    <BlurOutUp text={text} fontSize={38} fontWeight={600} color={BRAND.text} />
  </div>
);

const Showcase = () => {
  const rise = useRise();
  let at = INTRO;
  const spans = SCENES.map((s, i) => {
    const from = at;
    at += seg(s.sec);
    // хвост кроссфейда: предыдущая сцена живёт ещё XFADE кадров под следующей
    return { ...s, from, len: seg(s.sec) + (i < SCENES.length - 1 ? XFADE : 0), segLen: seg(s.sec) };
  });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 20,
          display: "flex",
          justifyContent: "center",
          opacity: rise.opacity,
          transform: rise.transform,
        }}
      >
        <div style={{ position: "relative", width: LAPTOP_W, aspectRatio: MACBOOK_PRO_14.ratio }}>
          {spans.map((s, i) => (
            <Sequence key={i} from={s.from} durationInFrames={s.len} layout="none">
              <ScreenClip src={s.src} first={i === 0} />
            </Sequence>
          ))}
          <Img
            src={staticFile(MACBOOK_PRO_14.frame)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          />
        </div>
      </div>
      {spans.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.segLen} layout="none">
          <Caption text={s.caption} />
        </Sequence>
      ))}
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
