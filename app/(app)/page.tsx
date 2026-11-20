import type { Metadata } from "next";
import { FastLink } from "@fast-link/next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import {
  AlarmClockCheck,
  ArrowRight,
  Bell,
  CheckCircle2,
  FilePlus2,
  FileText,
} from "lucide-react";
import { getCurrentStudent } from "@/lib/auth";
import { getExams, getGrades, getNotifications, getRequests, getScheduleForWeek } from "@/lib/data";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";
import { fontWeights } from "@/lib/font-weight";
import {
  formatDateShort,
  formatDuration,
  isoToday,
  minutesBetween,
  mondayOf,
  monthName,
  plural,
  relativeTime,
  WEEKDAYS_FULL,
  weekdayIndex,
} from "@/lib/format";
import { LessonRow } from "@/components/lesson-row";
import type { ScheduleEntry } from "@/lib/types";

export const metadata: Metadata = { title: "Главная — Деканат" };


function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function firstName(name: string) {
  return name.split(" ")[0];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

function NextClassCard({ today, nowTime }: { today: ScheduleEntry[]; nowTime: string }) {
  const active = today.find((e) => e.status !== "cancelled" && e.starts_at <= nowTime && nowTime < e.ends_at);
  const upcoming = today.find((e) => e.status !== "cancelled" && e.starts_at > nowTime);

  if (!active && !upcoming) {
    const had = today.some((e) => e.status !== "cancelled");
    return (
      <div className="rounded-2xl bg-surface-2 p-5">
        <p className={cn(typeClass("title"), "font-medium")}>
          {had ? "Пары на сегодня закончились" : "Сегодня занятий нет"}
        </p>
        <p className={cn("mt-1", typeClass("caption"), "text-muted-foreground")}>
          {had ? "Можно выдохнуть — остаток дня свободен" : "Свободный день — посмотрите расписание недели"}
        </p>
      </div>
    );
  }

  const e = (active ?? upcoming)!;
  const total = minutesBetween(e.starts_at, e.ends_at);
  const elapsed = active ? minutesBetween(e.starts_at, nowTime) : 0;
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

  return (
    <FastLink
      href="/schedule"
      className="block rounded-2xl p-5 text-white"
      style={{ background: "linear-gradient(135deg, oklch(0.5 0.19 262) 0%, oklch(0.42 0.17 285) 100%)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn(typeClass("caption"), "flex items-center gap-2 font-medium text-white/75")}>
          <span>{active ? "Идёт сейчас" : "Следующая пара"}</span>
          <span className="text-white/55">{e.starts_at}–{e.ends_at}</span>
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[length:var(--fs-micro,11px)] leading-[var(--lh-micro,14px)] font-medium">
          {active ? `до конца ${formatDuration(total - elapsed)}` : `в ${e.starts_at}`}
        </span>
      </div>
      <p className={cn("mt-2 text-[length:var(--fs-display,28px)] leading-[var(--lh-display,34px)] font-semibold tracking-tight")}>
        {e.subject}
      </p>
      <p className={cn("mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5", typeClass("body"), "text-white/80")}>
        <span>{e.kind}</span>
        <span>ауд. {e.room}</span>
        <span>{e.teacher}</span>
      </p>
      {active && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </FastLink>
  );
}

function Widget({
  href,
  icon: Icon,
  label,
  value,
  sub,
}: {
  href: string;
  icon: typeof Bell;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <FastLink
      href={href}
      className="group flex flex-col gap-2 rounded-2xl bg-surface-2 p-4 transition-colors hover:bg-surface-3"
    >
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className={typeClass("micro")}>{label}</span>
      </span>
      <span className={cn(typeClass("title"), "font-semibold tracking-tight")}>{value}</span>
      {sub && <span className={cn(typeClass("micro"), "truncate text-muted-foreground")}>{sub}</span>}
    </FastLink>
  );
}

export default async function DashboardPage() {
  await connection();
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  const todayISO = isoToday();
  const week = await getScheduleForWeek(student.id, mondayOf(todayISO));
  const grades = await getGrades(student.id);
  const requests = await getRequests(student.id);
  const notifications = await getNotifications(student.id);

  const today = week.filter((e) => e.date === todayISO);
  const nowTime = nowHHMM();

  const exams = (await getExams(student.id)).filter((e) => e.date >= todayISO && e.kind !== "консультация");
  const nextExam = exams[0];
  const examDaysLeft = nextExam
    ? Math.round((new Date(nextExam.date).getTime() - new Date(todayISO).getTime()) / 86400000)
    : null;

  const numericGrades = grades.filter((g) => g.grade && /^\d$/.test(g.grade)).map((g) => Number(g.grade));
  const avg = numericGrades.length
    ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(2)
    : null;

  const inWork = requests.filter((r) => r.status === "submitted" || r.status === "accepted" || r.status === "in_progress").length;
  const readyToPickup = requests.filter((r) => r.status === "ready").length;
  const unread = notifications.filter((n) => !n.read);
  const deadline = notifications.find((n) => n.type === "deadline");

  const weekdayName = WEEKDAYS_FULL[weekdayIndex(todayISO)];
  const dayLabel = `${weekdayName.charAt(0).toUpperCase()}${weekdayName.slice(1)}, ${formatDateShort(todayISO)}`;

  return (
    <div className="reveal-product flex flex-col gap-6">
      <header>
        <h1 className={cn(typeClass("display"), "font-semibold tracking-tight")} style={{ fontWeight: fontWeights.semibold }}>
          {greeting()}, {firstName(student.name)}
        </h1>
        <p className={cn(typeClass("body"), "mt-0.5 text-muted-foreground")}>{dayLabel}</p>
      </header>

      <NextClassCard today={today} nowTime={nowTime} />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Widget href="/grades" icon={CheckCircle2} label="СРЕДНИЙ БАЛЛ" value={avg ?? "—"} sub="за все семестры" />
        <Widget
          href="/requests"
          icon={FileText}
          label="ЗАЯВКИ"
          value={String(inWork + readyToPickup)}
          sub={readyToPickup > 0 ? `${plural(readyToPickup, "готова", "готовы", "готовы")} к выдаче` : inWork > 0 ? "в работе" : "нет активных"}
        />
        <Widget
          href="/notifications"
          icon={Bell}
          label="УВЕДОМЛЕНИЯ"
          value={String(unread.length)}
          sub={unread.length > 0 ? "непрочитанных" : "всё прочитано"}
        />
        <Widget
          href="/notifications"
          icon={AlarmClockCheck}
          label="ДЕДЛАЙН"
          value={deadline ? relativeTime(deadline.created_at).replace(" назад", "") : "—"}
          sub={deadline?.title}
        />
      </div>

      {nextExam && examDaysLeft != null && examDaysLeft <= 60 && (
        <FastLink
          href="/grades"
          className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4 transition-colors hover:bg-surface-3"
        >
          <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-surface-3 py-1.5">
            <span className="text-[length:var(--fs-title,18px)] font-semibold leading-5">{Number(nextExam.date.slice(8))}</span>
            <span className={cn(typeClass("micro"), "text-muted-foreground")}>{monthName(Number(nextExam.date.slice(5, 7)) - 1).slice(0, 3)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn(typeClass("micro"), "text-muted-foreground")}>БЛИЖАЙШИЙ {nextExam.kind.toUpperCase()}</p>
            <p className={cn("truncate", typeClass("subtitle"), "font-medium")}>{nextExam.subject}</p>
          </div>
          <span className={cn("shrink-0", typeClass("caption"), "font-medium text-muted-foreground")}>
            {examDaysLeft === 0 ? "сегодня" : examDaysLeft === 1 ? "завтра" : `через ${plural(examDaysLeft, "день", "дня", "дней")}`}
          </span>
        </FastLink>
      )}

      {today.length > 0 && (
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className={cn(typeClass("title"), "font-semibold")}>Расписание на сегодня</h2>
            <FastLink href="/schedule" className={cn(typeClass("caption"), "flex items-center gap-1 text-muted-foreground hover:text-foreground")}>
              Вся неделя <ArrowRight className="size-3" />
            </FastLink>
          </div>
          <div className="reveal-items flex flex-col gap-2">
            {today.map((e) => (
              <LessonRow key={e.id} entry={e} now={e.starts_at <= nowTime && nowTime < e.ends_at} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className={cn(typeClass("title"), "font-semibold")}>Важное</h2>
          <FastLink href="/notifications" className={cn(typeClass("caption"), "flex items-center gap-1 text-muted-foreground hover:text-foreground")}>
            Все уведомления <ArrowRight className="size-3" />
          </FastLink>
        </div>
        <div className="reveal-items flex flex-col gap-2">
          {unread.slice(0, 3).map((n) => (
            <FastLink
              key={n.id}
              href={n.href ?? "/notifications"}
              className="flex items-start gap-3 rounded-xl bg-surface-2 p-3.5 transition-colors hover:bg-surface-3"
            >
              <span className="min-w-0 flex-1">
                <span className={cn("block", typeClass("subtitle"), "font-medium")}>{n.title}</span>
                <span className={cn("mt-0.5 block", typeClass("caption"), "text-muted-foreground")}>{n.body}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                <span className={cn(typeClass("micro"), "text-muted-foreground")}>{relativeTime(n.created_at)}</span>
                <span className="size-2 rounded-full bg-[var(--fluid-accent,#6B97FF)]" />
              </span>
            </FastLink>
          ))}
        </div>
      </section>

      <FastLink
        href="/requests/new"
        className="group flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 transition-colors hover:border-foreground/25 hover:bg-surface-2"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-surface-3 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <FilePlus2 className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block", typeClass("subtitle"), "font-medium")}>Заказать справку или подать заявление</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </FastLink>
    </div>
  );
}
