"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { typeClass } from "@/lib/type-scale";
import {
  addDaysISO,
  formatDayTitle,
  formatDuration,
  isoToday,
  minutesBetween,
  relativeDayLabel,
  WEEKDAYS_SHORT,
} from "@/lib/format";
import { LessonRow } from "@/components/lesson-row";
import type { ScheduleEntry } from "@/lib/types";

function GapRow({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className={cn(typeClass("micro"), "text-muted-foreground")}>окно {formatDuration(minutes)}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function ScheduleView({ entries, weekStart }: { entries: ScheduleEntry[]; weekStart: string }) {
  const todayISO = isoToday();
  const initial = todayISO >= weekStart && todayISO < addDaysISO(weekStart, 7) ? todayISO : weekStart;
  const [selected, setSelected] = useState(initial);
  const [direction, setDirection] = useState(0);
  const touchX = useRef<number | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)), [weekStart]);
  const byDate = useMemo(() => {
    const map: Record<string, ScheduleEntry[]> = {};
    for (const e of entries) (map[e.date] ??= []).push(e);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.slot - b.slot);
    return map;
  }, [entries]);

  const idx = days.indexOf(selected);
  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(6, i));
    if (clamped === idx) return;
    setDirection(clamped > idx ? 1 : -1);
    setSelected(days[clamped]);
  };

  const dayEntries = byDate[selected] ?? [];
  const nowTime = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;

  const rows: (ScheduleEntry | { gap: number })[] = [];
  dayEntries.forEach((e, i) => {
    const prev = dayEntries[i - 1];
    if (prev) {
      const gap = minutesBetween(prev.ends_at, e.starts_at);
      if (gap >= 25) rows.push({ gap });
    }
    rows.push(e);
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto">
        <div className="grid min-w-0 grid-cols-7 gap-1">
          {days.map((d, i) => {
            const dd = d.slice(8);
            const active = d === selected;
            const isToday = d === todayISO;
            const hasChanges = (byDate[d] ?? []).some((e) => e.status !== "normal");
            return (
              <button
                key={d}
                onClick={() => goTo(i)}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-surface-2 hover:bg-surface-3"
                )}
              >
                <span className={cn(typeClass("micro"), active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {WEEKDAYS_SHORT[i]}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full",
                    typeClass("body"),
                    isToday && !active && "font-semibold text-[var(--fluid-accent,#6B97FF)]",
                    active && "font-semibold"
                  )}
                >
                  {Number(dd)}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {(byDate[d]?.length ?? 0) > 0 && (
                    <span className={cn("size-1 rounded-full", active ? "bg-primary-foreground/70" : "bg-muted-foreground/50")} />
                  )}
                  {hasChanges && <span className={cn("size-1 rounded-full", active ? "bg-amber-300" : "bg-amber-500")} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 48) goTo(idx + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <h2 className={cn("mb-2.5", typeClass("title"), "font-semibold")}>
          {relativeDayLabel(selected, todayISO)}
          {["Сегодня", "Завтра", "Вчера"].includes(relativeDayLabel(selected, todayISO)) && (
            <span className={cn("ml-2 font-normal text-muted-foreground", typeClass("caption"))}>
              {formatDayTitle(selected)}
            </span>
          )}
        </h2>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected}
            initial={{ opacity: 0, x: 14 * (direction || 1) }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 * (direction || 1) }}
            transition={spring.fast}
            className="flex flex-col gap-2"
          >
            {rows.length === 0 && (
              <div className="rounded-2xl bg-surface-2 p-6 text-center">
                <p className={cn(typeClass("subtitle"), "font-medium")}>Занятий нет</p>
                <p className={cn("mt-1", typeClass("caption"), "text-muted-foreground")}>
                  Свободный день — можно заняться курсовой
                </p>
              </div>
            )}
            {rows.map((r, i) =>
              "gap" in r ? <GapRow key={`gap-${i}`} minutes={r.gap} /> : (
                <LessonRow key={r.id} entry={r} now={selected === todayISO && r.starts_at <= nowTime && nowTime < r.ends_at} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
