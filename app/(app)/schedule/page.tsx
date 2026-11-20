import type { Metadata } from "next";
import { FastLink } from "@fast-link/next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentStudent } from "@/lib/auth";
import { getScheduleForWeek } from "@/lib/data";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";
import { addDaysISO, formatDateShort, isoToday, mondayOf } from "@/lib/format";
import { ScheduleView } from "@/components/schedule-view";

export const metadata: Metadata = { title: "Расписание — Деканат" };


export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await connection();
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  const { week } = await searchParams;
  const todayISO = isoToday();
  const weekStart = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? mondayOf(week) : mondayOf(todayISO);
  const entries = await getScheduleForWeek(student.id, weekStart);
  const isCurrentWeek = weekStart === mondayOf(todayISO);

  return (
    <div className="reveal-product flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={cn(typeClass("display"), "font-semibold tracking-tight")}>Расписание</h1>
          <p className={cn(typeClass("body"), "mt-0.5 text-muted-foreground")}>
            {formatDateShort(weekStart)} — {formatDateShort(addDaysISO(weekStart, 6))}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <FastLink
              href="/schedule"
              className={cn("mr-1 rounded-lg bg-surface-2 px-3 py-2", typeClass("caption"), "font-medium hover:bg-surface-3")}
            >
              Сегодня
            </FastLink>
          )}
          <FastLink
            href={`/schedule?week=${addDaysISO(weekStart, -7)}`}
            aria-label="Предыдущая неделя"
            className="flex size-9 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </FastLink>
          <FastLink
            href={`/schedule?week=${addDaysISO(weekStart, 7)}`}
            aria-label="Следующая неделя"
            className="flex size-9 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </FastLink>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="rounded-2xl bg-surface-2 p-8 text-center">
          <p className={cn(typeClass("subtitle"), "font-medium")}>На эту неделю расписания нет</p>
          <p className={cn("mt-1", typeClass("caption"), "text-muted-foreground")}>
            В прототипе данные заполнены только для текущей недели
          </p>
        </div>
      ) : (
        <ScheduleView entries={entries} weekStart={weekStart} />
      )}
    </div>
  );
}
