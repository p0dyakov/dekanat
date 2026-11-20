import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AtSign, Building2, CalendarDays, Clock, Contact, LogOut, Mail, MapPin, UserRound } from "lucide-react";
import { getCurrentStudent } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";

export const metadata: Metadata = { title: "Профиль — Деканат" };


function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn(typeClass("micro"), "text-muted-foreground")}>{label}</p>
        <p className={cn(typeClass("body"), "font-medium")}>{value}</p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  const initials = student.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="reveal-product mx-auto flex w-full max-w-lg flex-col gap-5">
      <header className="flex items-center gap-4">
        <span
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-[length:var(--fs-title,20px)] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--fluid-accent, #6B97FF), oklch(0.5 0.15 285))" }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <h1 className={cn(typeClass("display"), "truncate font-semibold tracking-tight")}>{student.name}</h1>
          <p className={cn(typeClass("body"), "text-muted-foreground")}>
            {student.group_name}, {student.course} курс
          </p>
        </div>
      </header>

      <section className="rounded-2xl bg-surface-2 px-4">
        <Row icon={UserRound} label="СТУДЕНЧЕСКИЙ БИЛЕТ" value={student.student_number} />
        <div className="h-px bg-border" />
        <Row icon={Building2} label="ФАКУЛЬТЕТ" value={student.faculty} />
        <div className="h-px bg-border" />
        <Row icon={CalendarDays} label="НАПРАВЛЕНИЕ" value={student.program} />
        <div className="h-px bg-border" />
        <Row icon={Mail} label="ПОЧТА" value={student.email} />
      </section>

      <section className="rounded-2xl bg-surface-2 px-4">
        <Row icon={Contact} label="КУРАТОР" value={student.curator} />
        <div className="h-px bg-border" />
        <Row icon={MapPin} label="ДЕКАНАТ" value={student.dean_office} />
        <div className="h-px bg-border" />
        <Row icon={Clock} label="ЧАСЫ ПРИЁМА" value={student.dean_hours} />
        <div className="h-px bg-border" />
        <Row icon={AtSign} label="ПОЧТА ДЕКАНАТА" value={student.dean_email} />
      </section>

      <form action={logoutAction}>
        <button
          type="submit"
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5",
            typeClass("body"), "font-medium text-red-600 transition-colors hover:bg-surface-3 dark:text-red-400"
          )}
        >
          <LogOut className="size-4" />
          Выйти из кабинета
        </button>
      </form>
    </div>
  );
}
