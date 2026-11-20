import { Composition } from "remotion";
import { Launch, LAUNCH_FRAMES } from "./video";

// remocn lays its components out for 1280x720 at 30 fps; render scales it to 1920x1080 (--scale=1.5).
export const RemotionRoot = () => (
  <Composition
    id="Launch"
    component={Launch}
    durationInFrames={LAUNCH_FRAMES}
    fps={30}
    width={1280}
    height={720}
  />
);
