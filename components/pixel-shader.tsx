"use client";

import { Dithering } from "@paper-design/shaders-react";

export function PixelShader({ className }: { className?: string }) {
  return (
    <Dithering
      className={className}
      colorBack="#f0f0f1"
      colorFront="#6b97ff"
      shape="swirl"
      type="4x4"
      size={5}
      speed={0.4}
    />
  );
}
