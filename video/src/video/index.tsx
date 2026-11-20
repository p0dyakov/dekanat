import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { Backdrop } from "@/components/remocn/backdrop";
import { SoftBlurIn } from "@/components/remocn/soft-blur-in";
import { BlurOutUp } from "@/components/remocn/blur-out-up";
import { Drift } from "@/components/remocn/drift";
import { focusPull } from "@/components/remocn/focus-pull";
import { pushThrough } from "@/components/remocn/push-through";
import { Device, MACBOOK_PRO_14, IPHONE_PRO_MAX } from "@/components/device";
import { Pop } from "@/components/pop-number";
import { BRAND, FONT_VARS, SANS } from "./brand";

// Длительности исходных клипов (сек) при playbackRate RATE → кадры @30fps
const RATE = 1.2;
const seg = (sec: number) => Math.round((sec / RATE) * 30);

const SCENES: { src: string; sec: number; caption: string }[] = [
  { src: "clips/c1-login.mp4", sec: 11.13, caption: "Вход в один клик — сразу дашборд" },
  { src: "clips/c2-schedule.mp4", sec: 10.54, caption: "Расписание: переносы, отмены и «окна»" },
  { src: "clips/c3-grades.mp4", sec: 11.04, caption: "Оценки, посещаемость и зимняя сессия" },
  { src: "clips/c4-requests.mp4", sec: 10.58, caption: "Справки и вопросы деканату со статусами" },
  { src: "clips/c4b-newreq.mp4", sec: 8.96, caption: "Новая заявка за полминуты" },
  { src: "clips/c5-notif.mp4", sec: 9.46, caption: "Уведомления об изменениях и дедлайнах" },
  { src: "clips/c5b-profile.mp4", sec: 7.21, caption: "Профиль и контакты деканата" },
];

const MOBILE_SCENES: { src: string; sec: number }[] = [
  { src: "clips/m1-dash.mp4", sec: 10.08 },
  { src: "clips/m2-schedule.mp4", sec: 9.63 },
  { src: "clips/m3-notif.mp4", sec: 9.42 },
];

const FADE = 12;
const TITLE = 100;
const SHOWCASE = 60 + SCENES.reduce((a, s) => a + seg(s.sec), 0);
const STATS = 140;
const SITE = 60 + MOBILE_SCENES.reduce((a, s) => a + seg(s.sec), 0);
const OUTRO = 100;
const T = 36;

export const LAUNCH_FRAMES = TITLE + SHOWCASE + STATS + SITE + OUTRO - 4 * T;

const caption = (node: React.ReactNode) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 52, height: 100 }}>{node}</div>
);

const Title = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", inset: 0, top: -30 }}>
      <SoftBlurIn text="Цифровой деканат" fontSize={120} fontWeight={700} color={BRAND.text} blur={16} />
    </div>
    <Sequence from={34}>
      <div style={{ position: "absolute", inset: 0, top: 190 }}>
        <SoftBlurIn text="Вся жизнь студента — в одном кабинете" fontSize={42} fontWeight={400} color={BRAND.accent} blur={10} />
      </div>
    </Sequence>
  </AbsoluteFill>
);

const useRise = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 26, mass: 1, stiffness: 90 } });
  return {
    opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
    transform: `perspective(1400px) translateY(${(1 - p) * 200}px) rotateX(${(1 - p) * 24}deg) scale(${0.88 + 0.12 * p})`,
  };
};

const Showcase = () => {
  const rise = useRise();
  let at = 60;
  return (
    <Drift grow={0.04}>
      {SCENES.map((s, i) => {
        const from = at;
        at += seg(s.sec);
        return (
          <Sequence key={i} from={from} durationInFrames={seg(s.sec)}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 56, display: "flex", justifyContent: "center", ...(i === 0 ? rise : {}) }}>
              <Device spec={MACBOOK_PRO_14} src={s.src} playbackRate={RATE} style={{ width: 880 }} />
            </div>
            {caption(<BlurOutUp text={s.caption} fontSize={40} fontWeight={600} color={BRAND.text} />)}
          </Sequence>
        );
      })}
    </Drift>
  );
};

const Card = ({ value, label, delay }: { value: string; label: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
        borderRadius: 20,
        border: `1px solid ${BRAND.border}`,
        boxShadow: BRAND.shadow,
        background: BRAND.card,
        padding: "36px 48px",
        textAlign: "center",
      }}
    >
      <Pop value={value} fontSize={104} delay={delay + 6} />
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: BRAND.muted, marginTop: 10 }}>{label}</div>
    </div>
  );
};

const Stats = () => (
  <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 36, fontFamily: SANS }}>
    <Card value="6" label="разделов в кабинете" delay={4} />
    <Card value="2" label="студента, свои данные" delay={16} />
    <Card value="0" label="очередей за справками" delay={28} />
  </div>
);

const Site = () => {
  const rise = useRise();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 50, fps, config: { damping: 20, stiffness: 120 } });
  return (
    <>
      <div style={{ position: "absolute", left: 120, top: 30, display: "flex", justifyContent: "center", ...rise }}>
        {(() => {
          let at = 60;
          return MOBILE_SCENES.map((s, i) => {
            const from = at;
            at += seg(s.sec);
            return (
              <Sequence key={i} from={from} durationInFrames={seg(s.sec)}>
                <Device spec={IPHONE_PRO_MAX} src={s.src} playbackRate={RATE} style={{ height: 660 }} />
              </Sequence>
            );
          });
        })()}
      </div>
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 200,
          opacity: p,
          transform: `translateY(${(1 - p) * 18}px)`,
          textAlign: "center",
          fontFamily: SANS,
        }}
      >
        <Img src={staticFile("stills/qr.png")} style={{ width: 150, height: 150, borderRadius: 20, border: `1px solid ${BRAND.border}`, boxShadow: BRAND.shadow }} />
        <div style={{ fontWeight: 700, fontSize: 28, color: BRAND.text, marginTop: 18 }}>dekanat.p0dyakov.workers.dev</div>
        <div style={{ fontWeight: 400, fontSize: 22, color: BRAND.muted, marginTop: 8 }}>ivanova · dekanat2026</div>
      </div>
      <Sequence from={20}>{caption(<BlurOutUp text="И с телефона — расписание в кармане" fontSize={40} fontWeight={600} color={BRAND.text} />)}</Sequence>
    </>
  );
};

const Outro = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", inset: 0, top: -30 }}>
      <SoftBlurIn text="Деканат будущего" fontSize={120} fontWeight={700} color={BRAND.text} blur={16} />
    </div>
    <Sequence from={28}>
      <div style={{ position: "absolute", inset: 0, top: 190 }}>
        <BlurOutUp text="Концепт для конкурса · все данные вымышленные" fontSize={40} fontWeight={400} color={BRAND.muted} />
      </div>
    </Sequence>
  </AbsoluteFill>
);

export const Launch = () => (
  <AbsoluteFill style={{ ...FONT_VARS, background: BRAND.bg, fontFamily: SANS }}>
    <Backdrop fill={<div style={{ width: "100%", height: "100%", background: `radial-gradient(ellipse at 50% 30%, ${BRAND.accent}0d 0%, ${BRAND.bg} 62%)` }} />} />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={TITLE}>
        <Title />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={linearTiming({ durationInFrames: T })} presentation={focusPull()} />
      <TransitionSeries.Sequence durationInFrames={SHOWCASE}>
        <Showcase />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={linearTiming({ durationInFrames: T })} presentation={pushThrough()} />
      <TransitionSeries.Sequence durationInFrames={STATS}>
        <Stats />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={linearTiming({ durationInFrames: T })} presentation={focusPull()} />
      <TransitionSeries.Sequence durationInFrames={SITE}>
        <Site />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={linearTiming({ durationInFrames: T })} presentation={focusPull()} />
      <TransitionSeries.Sequence durationInFrames={OUTRO}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
