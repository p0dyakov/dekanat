"use client"

import {
  Big,
  Card,
  Muted,
  Slide,
  TitleSlide,
  ThanksSlide,
  type SlideProps,
} from "@/components/slides/blocks"

export type { SlideProps, SlideDef } from "@/components/slides/blocks"

function DataSlide({ play }: SlideProps) {
  return (
    <Slide title="Данные">
      <div className="grid flex-1 grid-cols-3 gap-4">
        <Card className="flex flex-col justify-between">
          <Big value="42" play={play} delay={120} />
          <Muted>ключевая цифра и подпись к ней</Muted>
        </Card>
      </div>
    </Slide>
  )
}

export const SLIDES: import("@/components/slides/blocks").SlideDef[] = [
  {
    name: "Титул",
    shader: 6,
    render: () => <TitleSlide title="Название">Команда и авторы</TitleSlide>,
  },
  { name: "Данные", render: (p) => <DataSlide {...p} /> },
  { name: "Спасибо", shader: 14, render: () => <ThanksSlide /> },
]
