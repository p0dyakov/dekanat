"use client"

/* eslint-disable @next/next/no-img-element */
import { type CSSProperties, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { typeClass } from "@/lib/size-context"
import { fontWeights } from "@/lib/font-weight"
import { cn } from "@/lib/utils"
import { PopNumber } from "@/components/slides/pop-number"

/** One slide's context: `play` once it is on screen (never in print). */
export interface SlideProps {
  play: boolean
  print: boolean
}

export interface SlideDef {
  name: string
  /** Full-screen shader behind the slide; the number is its still frame for print. */
  shader?: number
  render: (p: SlideProps) => ReactNode
}

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
export const t = (role: Parameters<typeof typeClass>[0]) =>
  typeClass(role, "default")
export const SERIF: CSSProperties = {
  fontFamily:
    "var(--font-geist-serif-regular), var(--font-serif-cyrillic), serif",
}
export const SEMIBOLD: CSSProperties = {
  fontVariationSettings: fontWeights.semibold,
}

/** 960×540 stage: fixed title slot on top, content fills the rest. */
export function Slide({
  title,
  children,
}: {
  title: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex size-full flex-col px-12 pt-11 pb-12">
      <h2
        className={cn(t("display"), "flex shrink-0 items-center text-foreground")}
      >
        {title}
      </h2>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

/** Surface card: elevation 3 on the white page, container radius 12px. */
export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("rounded-xl bg-surface-3 p-5 shadow-surface-3", className)}
    >
      {children}
    </div>
  )
}

/** A key number: serif, display size, pops in on the drum. */
export function Big({
  value,
  play,
  delay,
  size,
}: {
  value: string
  play: boolean
  delay?: number
  size?: number
}) {
  return (
    <div
      className={cn(t("display"), "whitespace-nowrap text-foreground")}
      style={{ ...SERIF, ...(size ? { fontSize: size, lineHeight: 1 } : {}) }}
    >
      <PopNumber value={value} play={play} delay={delay} />
    </div>
  )
}

export function Strong({ children }: { children: ReactNode }) {
  return (
    <p className={cn(t("body"), "text-foreground")} style={SEMIBOLD}>
      {children}
    </p>
  )
}

export function Muted({ children }: { children: ReactNode }) {
  return (
    <p className={cn(t("body"), "whitespace-pre-line text-muted-foreground")}>
      {children}
    </p>
  )
}

/** Numbered step list inside a card; an item is "title" or ["title", "note"]. */
export function Steps({ items }: { items: (string | [string, string])[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => {
        const [title, note] = Array.isArray(item) ? item : [item]
        return (
          <li key={title} className="flex gap-3 border-t border-border py-3">
            <span
              className={cn(t("body"), "w-4 text-muted-foreground tabular-nums")}
            >
              {i + 1}.
            </span>
            <div className="flex flex-col gap-0.5">
              <span className={cn(t("body"), "text-foreground")}>{title}</span>
              {note && (
                <span className={cn(t("caption"), "text-muted-foreground")}>
                  {note}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Accent badge plus muted caption, the header row of a case card. */
export function CaseHead({ n, children }: { n: number; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Badge color="accent">Кейс {n}</Badge>
      <span className={cn(t("caption"), "text-muted-foreground")}>
        {children}
      </span>
    </div>
  )
}

/** Logo top-left, big title above the author line at the bottom. */
export function TitleSlide({
  logo = `${BASE}/slides/brand.svg`,
  title,
  children,
}: {
  logo?: string
  title: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex size-full flex-col justify-between px-12 pt-11 pb-12">
      <img src={logo} alt="" className="h-14 w-auto self-start" />
      <h1 className={cn(t("display"), "text-foreground")}>{title}</h1>
      <div className={cn(t("body"), "flex gap-6 text-foreground")}>
        {children}
      </div>
    </div>
  )
}

export function ThanksSlide({
  children = "Спасибо за внимание",
}: {
  children?: ReactNode
}) {
  return (
    <div className="flex size-full items-center px-12">
      <h2 className={cn(t("display"), "text-foreground")}>{children}</h2>
    </div>
  )
}
