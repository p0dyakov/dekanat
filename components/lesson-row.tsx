import { AlarmClock, ArrowRight, Ban, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";
import { Badge } from "@/components/ui/badge";
import type { ScheduleEntry } from "@/lib/types";

export const KIND_COLOR: Record<string, string> = {
  "лекция": "blue",
  "семинар": "green",
  "лабораторная": "violet",
  "практика": "teal",
};

const STATUS_PILL = {
  cancelled: { icon: Ban, label: "Отменено", color: "#ef4444" },
  substitute: { icon: RefreshCw, label: "Замена", color: "#f59e0b" },
  moved: { icon: AlarmClock, label: "Перенесено", color: "#f59e0b" },
} as const;

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_PILL[status as keyof typeof STATUS_PILL];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-[length:var(--fs-caption-compact,11px)] leading-[var(--lh-caption-compact,14px)] font-medium"
      style={{ backgroundColor: `color-mix(in srgb, ${s.color} 15%, var(--background))` }}
    >
      <Icon className="size-3 shrink-0" />
      {s.label}
    </span>
  );
}

export function LessonRow({ entry, now }: { entry: ScheduleEntry; now?: boolean }) {
  const cancelled = entry.status === "cancelled";
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl bg-surface-2 p-3.5",
        cancelled && "opacity-60",
        now && "ring-1 ring-[color:var(--fluid-accent,#6B97FF)] bg-surface-3"
      )}
    >
      <div className="flex w-11 shrink-0 flex-col items-center pt-0.5">
        <span className={cn(typeClass("body"), "font-semibold")}>{entry.slot}</span>
        <span className={cn(typeClass("micro"), "text-muted-foreground")}>пара</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn(typeClass("subtitle"), "font-medium", cancelled && "line-through")}>
            {entry.subject}
          </span>
          <Badge variant="solid" color={(KIND_COLOR[entry.kind] ?? "gray") as never} size="compact">
            {entry.kind}
          </Badge>
          <StatusBadge status={entry.status} />
        </div>
        <div className={cn("mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5", typeClass("caption"), "text-muted-foreground")}>
          <span>
            {entry.status === "moved" && entry.orig_starts_at ? (
              <>
                <span className="line-through">{entry.orig_starts_at}</span>{" "}
                <ArrowRight className="inline size-3 -translate-y-px" />{" "}
                <span className="font-medium text-foreground">{entry.starts_at}</span>
              </>
            ) : (
              entry.starts_at
            )}
            –{entry.ends_at}
          </span>
          <span>
            {entry.status === "moved" && entry.orig_room ? (
              <>
                ауд. <span className="line-through">{entry.orig_room}</span>{" "}
                <span className="font-medium text-foreground">{entry.room}</span>
              </>
            ) : (
              `ауд. ${entry.room}`
            )}
          </span>
          <span>{entry.teacher}</span>
        </div>
        {entry.change_note && (
          <p className={cn("mt-1", typeClass("caption"), "text-amber-600 dark:text-amber-400")}>
            {entry.change_note}
          </p>
        )}
      </div>
    </div>
  );
}
