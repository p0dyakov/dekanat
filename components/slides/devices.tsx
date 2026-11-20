"use client"

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

// Device frames from the Figma file, screens cut out. Screen boxes are
// fractions of the frame (desktop_frame.png is 2400×1452; the screen
// hole measures 250–2150 × 40–1273 px), then grown 0.2% uniformly past
// the hole so the video tucks under the bezel — sub-pixel rounding would
// otherwise leave hairline strips of slide background.
const LAPTOP = {
  ratio: 2400 / 1452,
  screen: [0.10324, 0.02601, 0.89728, 0.87867],
}

function Screen({
  src,
  poster,
  still,
  play,
}: {
  src: string
  poster: string
  still: boolean
  play: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (play) {
      video.currentTime = 0
      video.play().catch(() => {})
    } else video.pause()
  }, [play])
  if (still)
    return <img src={poster} alt="" className="size-full object-cover" />
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="auto"
      className="size-full object-cover"
    />
  )
}

function box([x0, y0, x1, y1]: number[]) {
  return {
    left: `${x0 * 100}%`,
    top: `${y0 * 100}%`,
    width: `${(x1 - x0) * 100}%`,
    height: `${(y1 - y0) * 100}%`,
  }
}

export function Laptop({
  still,
  play,
  className,
}: {
  still: boolean
  play: boolean
  className?: string
}) {
  return (
    <div
      className={cn("relative", className)}
      style={{ aspectRatio: LAPTOP.ratio }}
    >
      <div
        className="absolute overflow-hidden bg-background"
        style={box(LAPTOP.screen)}
      >
        <Screen
          src={`${BASE}/slides/desktop.mp4`}
          poster={`${BASE}/slides/desktop.jpg`}
          still={still}
          play={play}
        />
      </div>
      <img
        src={`${BASE}/slides/desktop_frame.png`}
        alt="Сайт на ноутбуке"
        className="pointer-events-none absolute inset-0 size-full"
      />
    </div>
  )
}
