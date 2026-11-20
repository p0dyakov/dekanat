import { Img, OffthreadVideo, staticFile } from "remotion";

// Screen boxes are fractions of the frame PNG. The values below come from
// config/util/screen-recorder/devices.json (screen px box) divided by the
// frame's pixel size; new devices are computed the same way.
export interface DeviceSpec {
  frame: string;
  ratio: number;
  screen: [number, number, number, number];
}

export const MACBOOK_PRO_14: DeviceSpec = {
  frame: "frames/MacBook Pro 14 - Silver.png",
  ratio: 3824 / 2564,
  // screen в devices.json — [x, y, w, h]: 402,300,3024,1968 → доли x0,y0,x1,y1
  screen: [0.1046, 0.117, 0.8954, 0.883],
};

export const IPHONE_PRO_MAX: DeviceSpec = {
  frame: "frames/iPhone 17 Pro Max - Silver.png",
  ratio: 1520 / 3068,
  screen: [0.06579, 0.03259, 0.93421, 0.96741],
};

const box = ([x0, y0, x1, y1]: DeviceSpec["screen"]) => ({
  left: `${x0 * 100}%`,
  top: `${y0 * 100}%`,
  width: `${(x1 - x0) * 100}%`,
  height: `${(y1 - y0) * 100}%`,
});

/** Экранный прямоугольник MacBook Pro 14 в долях рамки — для монтажа без <Device>. */
export const SCREEN_BOX: React.CSSProperties = box(MACBOOK_PRO_14.screen);

const fill: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

/** A PNG frame with the screen cut out; a clip or a still inside the hole. */
export const Device = ({
  spec,
  src,
  poster,
  playbackRate,
  startFrom,
  endAt,
  style,
}: {
  spec: DeviceSpec;
  src?: string;
  poster?: string;
  playbackRate?: number;
  startFrom?: number;
  endAt?: number;
  style?: React.CSSProperties;
}) => {
  const clip = src ?? poster;
  return (
    <div style={{ position: "relative", aspectRatio: spec.ratio, ...style }}>
      <div style={{ position: "absolute", overflow: "hidden", background: "#000", ...box(spec.screen) }}>
        {src ? (
          <OffthreadVideo
            src={staticFile(src)}
            muted
            startFrom={startFrom}
            endAt={endAt}
            playbackRate={playbackRate}
            style={fill}
          />
        ) : (
          clip && <Img src={staticFile(clip)} style={fill} />
        )}
      </div>
      <Img
        src={staticFile(spec.frame)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
    </div>
  );
};
