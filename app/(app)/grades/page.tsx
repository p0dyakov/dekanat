import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentStudent } from "@/lib/auth";
import { getExams, getGrades } from "@/lib/data";
import { formatDateShort, isoToday, WEEKDAYS_SHORT, weekdayIndex } from "@/lib/format";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";
import { Badge } from "@/components/ui/badge";
import type { Exam, Grade } from "@/lib/types";

export const metadata: Metadata = { title: "Успеваемость — Деканат" };


function pointsLabel(points: number | null) {
  if (points == null) return "";
  if (points >= 85) return "на «5»";
  if (points >= 70) return "на «4»";
  if (points >= 50) return "на «3»";
  return "ниже порога";
}

function SemesterBlock({ semester, rows }: { semester: string; rows: Grade[] }) {
  return (
    <section>
      <h2 className={cn("mb-2.5", typeClass("title"), "font-semibold")}>{semester}</h2>
      <div className="reveal-items flex flex-col gap-2">
        {rows.map((g) => (
          <div key={g.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className={cn(typeClass("subtitle"), "font-medium")}>{g.subject}</span>
                <Badge variant="solid" color="gray" size="compact">{g.kind}</Badge>
              </div>
              <p className={cn("mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5", typeClass("caption"), "text-muted-foreground")}>
                {g.grade ? (
                  <>
                    <span>Итог: {g.grade}</span>
                    <span>{g.credits} з.е.</span>
                    <span>{g.teacher}</span>
                  </>
                ) : (
                  <>
                    <span>Баллы: {g.points}</span>
                    <span>{pointsLabel(g.points)}</span>
                    {g.attendance != null && (
                      <span className={cn(
                        "font-medium",
                        g.attendance >= 80 ? "text-emerald-600 dark:text-emerald-400" : g.attendance >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                      )}>
                        посещаемость {g.attendance}%
                      </span>
                    )}
                    <span>{g.teacher}</span>
                  </>
                )}
              </p>
              {g.points != null && (
                <div className="mt-2 h-1 w-40 max-w-full overflow-hidden rounded-full bg-surface-4">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      g.points >= 70 ? "bg-emerald-500" : g.points >= 50 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${g.points}%` }}
                  />
                </div>
              )}
            </div>
            {g.grade && (
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl font-semibold",
                  typeClass("title"),
                  g.grade === "зачёт" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  g.grade === "5" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  g.grade === "4" && "bg-blue-500/15 text-blue-600 dark:text-blue-400",
                  g.grade === "3" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  (g.grade === "2" || g.grade === "незачёт") && "bg-red-500/15 text-red-600 dark:text-red-400"
                )}
              >
                {g.grade === "зачёт" ? "З" : g.grade}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ExamRow({ exam, todayISO }: { exam: Exam; todayISO: string }) {
  const past = exam.date < todayISO;
  return (
    <div className={cn("flex items-center gap-3 rounded-xl bg-surface-2 p-3.5", past && "opacity-50")}>
      <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-surface-3 py-1.5">
        <span className="text-[length:var(--fs-title,18px)] font-semibold leading-5">{Number(exam.date.slice(8))}</span>
        <span className={cn(typeClass("micro"), "text-muted-foreground")}>{WEEKDAYS_SHORT[weekdayIndex(exam.date)]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn(typeClass("subtitle"), "font-medium")}>{exam.subject}</span>
          <Badge variant={exam.kind === "консультация" ? "ghost" : "solid"} color="gray" size="compact">{exam.kind}</Badge>
        </div>
        <p className={cn("mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5", typeClass("caption"), "text-muted-foreground")}>
          <span>{formatDateShort(exam.date)}</span>
          <span>{exam.starts_at}</span>
          <span>ауд. {exam.room}</span>
          <span>{exam.teacher}</span>
        </p>
      </div>
    </div>
  );
}

export default async function GradesPage() {
  await connection();
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  const grades = await getGrades(student.id);
  const exams = await getExams(student.id);
  const semesters = [...new Set(grades.map((g) => g.semester))];
  const current = semesters[0];
  const currentRows = grades.filter((g) => g.semester === current);

  const numeric = grades.filter((g) => g.grade && /^\d$/.test(g.grade)).map((g) => Number(g.grade));
  const avg = numeric.length ? (numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(2) : null;
  const credits = grades.filter((g) => g.grade && g.grade !== "незачёт" && g.grade !== "2").reduce((s, g) => s + g.credits, 0);
  const passed = currentRows.filter((g) => g.points != null && g.points >= 70).length;

  return (
    <div className="reveal-product flex flex-col gap-6">
      <header>
        <h1 className={cn(typeClass("display"), "font-semibold tracking-tight")}>Успеваемость</h1>
        <p className={cn(typeClass("body"), "mt-0.5 text-muted-foreground")}>{current}</p>
      </header>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className={cn(typeClass("micro"), "text-muted-foreground")}>СРЕДНИЙ БАЛЛ</p>
          <p className={cn("mt-1.5 text-[length:var(--fs-display,28px)] leading-[var(--lh-display,34px)] font-semibold tracking-tight")}>
            {avg ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className={cn(typeClass("micro"), "text-muted-foreground")}>КРЕДИТОВ</p>
          <p className={cn("mt-1.5 text-[length:var(--fs-display,28px)] leading-[var(--lh-display,34px)] font-semibold tracking-tight")}>
            {credits}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className={cn(typeClass("micro"), "text-muted-foreground")}>НА «4» И ВЫШЕ</p>
          <p className={cn("mt-1.5 text-[length:var(--fs-display,28px)] leading-[var(--lh-display,34px)] font-semibold tracking-tight")}>
            {passed}/{currentRows.length}
          </p>
        </div>
      </div>

      <section>
        <h2 className={cn("mb-2.5", typeClass("title"), "font-semibold")}>{exams[0]?.semester ?? "Сессия"}</h2>
        <div className="reveal-items flex flex-col gap-2">
          {exams.map((e) => <ExamRow key={e.id} exam={e} todayISO={isoToday()} />)}
        </div>
      </section>

      {semesters.map((sem) => (
        <SemesterBlock key={sem} semester={sem} rows={grades.filter((g) => g.semester === sem)} />
      ))}

    </div>
  );
}
