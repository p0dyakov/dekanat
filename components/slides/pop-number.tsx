"use client"

import { type CSSProperties } from "react"
import { cn } from "@/lib/utils"

interface PopNumberProps {
  value: string
  /** Plays when the slide is on screen; off, the digits wait hidden. */
  play: boolean
  /** Extra wait before the first glyph, ms. */
  delay?: number
  className?: string
}

/** Transitions.dev «Number pop-in»: every glyph rises on the drum, a stagger apart. */
export function PopNumber({
  value,
  play,
  delay = 0,
  className,
}: PopNumberProps) {
  return (
    <span
      className={cn(
        "t-digit-group tabular-nums",
        play && "is-animating",
        className
      )}
      style={{ "--digit-wait": `${delay}ms` } as CSSProperties}
      aria-label={value}
    >
      {[...value].map((ch, i) => (
        <span
          key={i}
          className="t-digit"
          aria-hidden="true"
          style={{ "--digit-i": i } as CSSProperties}
        >
          {ch}
        </span>
      ))}
    </span>
  )
}
