import type { Metadata } from "next";
import type { ComponentProps } from "react";
import { FastLink } from "@fast-link/next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { CheckCircle2, FilePlus2, MapPin, PackageCheck } from "lucide-react";
import { getCurrentStudent } from "@/lib/auth";
import { getRequestEvents, getRequests, REQUEST_STEPS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";
import { Badge } from "@/components/ui/badge";
import { formatDateFull, relativeTime } from "@/lib/format";
import type { StudentRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Заявки — Деканат" };


const STATUS_BADGE = {
  submitted: { color: "gray", label: "Подана" },
  accepted: { color: "blue", label: "Принята" },
  in_progress: { color: "amber", label: "В работе" },
  ready: { color: "green", label: "Готова" },
  rejected: { color: "red", label: "Отклонена" },
} satisfies Record<
  StudentRequest["status"],
  { color: NonNullable<ComponentProps<typeof Badge>["color"]>; label: string }
>;

function Stepper({ request, events }: { request: StudentRequest; events: { status: string; at: string; note: string | null }[] }) {
  if (request.status === "rejected") {
    const ev = events.find((e) => e.status === "rejected");
    return (
      <div className="mt-3 rounded-xl bg-destructive/10 p-3">
        <p className={cn(typeClass("caption"), "font-medium text-foreground")}>Заявка отклонена</p>
        {ev?.note && <p className={cn("mt-0.5", typeClass("caption"), "text-muted-foreground")}>{ev.note}</p>}
      </div>
    );
  }
  const stepIndex = REQUEST_STEPS.findIndex((s) => s.key === request.status);
  return (
    <div className="mt-4 flex items-center">
      {REQUEST_STEPS.map((s, i) => {
        const ev = events.find((e) => e.status === s.key);
        const reached = i <= stepIndex;
        return (
          <div key={s.key} className={cn("flex items-center", i < REQUEST_STEPS.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  reached ? "bg-primary text-primary-foreground" : "bg-surface-4 text-muted-foreground"
                )}
              >
                {reached ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  typeClass("micro"),
                  "whitespace-nowrap",
                  reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
              <span className={cn(typeClass("micro"), "-mt-0.5 text-muted-foreground")}>
                {ev ? relativeTime(ev.at) : ""}
              </span>
            </div>
            {i < REQUEST_STEPS.length - 1 && (
              <div className={cn("mx-1 mb-6 h-px flex-1", i < stepIndex ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  await connection();
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  const { created } = await searchParams;

  const requests = await getRequests(student.id);
  const events = await getRequestEvents(requests.map((r) => r.id));

  return (
    <div className="reveal-product flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={cn(typeClass("display"), "font-semibold tracking-tight")}>Заявки и справки</h1>
        </div>
        <FastLink
          href="/requests/new"
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-primary-foreground",
            typeClass("body"), "font-medium"
          )}
        >
          <FilePlus2 className="size-4" />
          <span className="hidden sm:inline">Новая заявка</span>
          <span className="sm:hidden">Новая</span>
        </FastLink>
      </div>

      {created && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3.5 text-emerald-700 dark:text-emerald-400">
          <PackageCheck className="size-4 shrink-0" />
          <p className={cn(typeClass("body"), "font-medium")}>
            Заявка подана. Уведомим, когда её проверит деканат.
          </p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-card-foreground">
          <p className={cn(typeClass("subtitle"), "font-medium")}>Пока ни одной заявки</p>
          <p className={cn("mt-1", typeClass("caption"), "text-muted-foreground")}>
            Справки и заявления оформляются онлайн за пару минут
          </p>
        </div>
      ) : (
        <div className="reveal-items flex flex-col gap-3">
          {requests.map((r) => {
            const st = r.kind === "вопрос" && r.status === "ready"
              ? { color: "green" as const, label: "Отвечено" }
              : STATUS_BADGE[r.status];
            const latest = events[r.id]?.[events[r.id].length - 1];
            return (
              <article key={r.id} className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <Badge variant="solid" color={st.color} size="compact">{st.label}</Badge>
                  {r.kind === "вопрос" && <Badge variant="ghost" color="gray" size="compact">вопрос</Badge>}
                  <span className={cn(typeClass("micro"), "text-muted-foreground")}>№ {r.number}</span>
                  <span className={cn("ml-auto", typeClass("micro"), "text-muted-foreground")}>
                    {formatDateFull(r.created_at.slice(0, 10))}
                  </span>
                </div>
                <h2 className={cn("mt-2", typeClass("subtitle"), "font-medium")}>{r.title}</h2>
                {r.detail && (
                  <p className={cn("mt-1", typeClass("caption"), "line-clamp-2 text-muted-foreground")}>{r.detail}</p>
                )}
                {r.status === "ready" && r.pickup && (
                  <p className={cn("mt-2 flex items-center gap-1.5", typeClass("caption"), "font-medium text-emerald-700 dark:text-emerald-400")}>
                    <MapPin className="size-3.5 shrink-0" /> {r.pickup}
                  </p>
                )}
                {r.status === "ready" && latest?.note && !r.pickup && (
                  <p className={cn("mt-2 flex items-center gap-1.5", typeClass("caption"), "font-medium text-emerald-700 dark:text-emerald-400")}>
                    <MapPin className="size-3.5 shrink-0" /> {latest.note}
                  </p>
                )}
                {r.answer && (
                  <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
                    <p className={cn(typeClass("micro"), "font-medium text-muted-foreground")}>Ответ деканата</p>
                    <p className={cn("mt-1", typeClass("caption"))}>{r.answer}</p>
                  </div>
                )}
                <Stepper request={r} events={events[r.id] ?? []} />
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
