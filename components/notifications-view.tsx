"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  FileText,
  Megaphone,
  Trophy,
} from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { typeClass } from "@/lib/type-scale";
import { relativeTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";

const FILTERS = ["Все", "Непрочитанные", "Новости", "Расписание", "Заявки", "Дедлайны"] as const;
type Filter = (typeof FILTERS)[number];

const TYPE_MAP: Record<string, Filter> = {
  news: "Новости",
  schedule: "Расписание",
  request: "Заявки",
  deadline: "Дедлайны",
};

const TYPE_ICON: Record<string, typeof Bell> = {
  news: Megaphone,
  schedule: CalendarClock,
  request: FileText,
  deadline: Trophy,
};

function Icon({ type }: { type: string }) {
  const I = TYPE_ICON[type] ?? Bell;
  const urgent = type === "deadline";
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl",
        urgent ? "bg-red-500/12 text-red-600 dark:text-red-400" : "bg-surface-3 text-muted-foreground"
      )}
    >
      {urgent ? <AlertTriangle className="size-4" /> : <I className="size-4" />}
    </span>
  );
}

export function NotificationsView({ items }: { items: AppNotification[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("Все");
  const [pending, startTransition] = useTransition();
  const touch = useRef<{ x: number; y: number } | null>(null);

  const unreadCount = items.filter((n) => !n.read).length;
  const filtered = items.filter((n) => {
    if (filter === "Все") return true;
    if (filter === "Непрочитанные") return !n.read;
    return TYPE_MAP[n.type] === filter;
  });

  const open = (n: AppNotification) => {
    if (!n.read) startTransition(() => markNotificationRead(n.id));
    if (n.href) router.push(n.href);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1.5",
                typeClass("caption"),
                "font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
              )}
            >
              {f}
              {f === "Непрочитанные" && unreadCount > 0 && (
                <span className="ml-1 opacity-60">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => startTransition(() => markAllNotificationsRead())}
            disabled={pending}
            className={cn("flex shrink-0 items-center gap-1.5", typeClass("caption"), "text-muted-foreground hover:text-foreground")}
          >
            <CheckCheck className="size-3.5" />
            <span className="hidden sm:inline">Прочитать все</span>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface-2 p-8 text-center">
          <p className={cn(typeClass("subtitle"), "font-medium")}>Тут пусто</p>
          <p className={cn("mt-1", typeClass("caption"), "text-muted-foreground")}>
            {filter === "Непрочитанные" ? "Всё прочитано — отличная работа" : "В этой категории пока ничего нет"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {filtered.map((n: AppNotification) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: -6 }}
                transition={spring.fast}
                className="relative overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 flex items-center justify-end bg-primary/15 pr-5">
                  <CheckCheck className="size-4 text-primary" />
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => open(n)}
                  onKeyDown={(e) => e.key === "Enter" && open(n)}
                  onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
                  onTouchEnd={(e) => {
                    if (!touch.current || n.read) return;
                    const dx = e.changedTouches[0].clientX - touch.current.x;
                    const dy = Math.abs(e.changedTouches[0].clientY - touch.current.y);
                    if (dx > 64 && dy < 30) startTransition(() => markNotificationRead(n.id));
                    touch.current = null;
                  }}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 bg-surface-2 p-3.5 transition-[transform,background-color] duration-200 hover:bg-surface-3",
                    !n.read && "bg-surface-2"
                  )}
                >
                  <Icon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(typeClass("subtitle"), !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                    <p className={cn("mt-0.5", typeClass("caption"), "text-muted-foreground")}>{n.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                    <span className={cn(typeClass("micro"), "text-muted-foreground")}>{relativeTime(n.created_at)}</span>
                    {!n.read && <span className="size-2 rounded-full bg-[var(--fluid-accent,#6B97FF)]" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
