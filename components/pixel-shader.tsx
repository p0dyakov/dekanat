"use client";

import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";

export function PixelShader({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <Dithering
      className={className}
      colorBack="#f0f0f1"
      colorFront="#6b97ff"
      shape="swirl"
      type="4x4"
      size={5}
      speed={reduceMotion ? 0 : 0.08}
    />
  );
}
