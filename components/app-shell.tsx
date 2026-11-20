"use client";

import { type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FastLink } from "@fast-link/next";
import {
  Bell,
  CalendarDays,
  FileText,
  GraduationCap,
  House,
  LogOut,
  TrendingUp,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MenuItem } from "@/components/ui/menu-item";
import { SidebarUserFooter } from "@/components/sidebar-app/user-footer";
import { ThemeMenuItem, ThemeToggleButton } from "@/components/theme-toggle";
import { logoutAction } from "@/app/actions";
import type { Student } from "@/lib/types";

const NAV = [
  { href: "/", label: "Главная", icon: House },
  { href: "/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/grades", label: "Оценки", icon: TrendingUp },
  { href: "/requests", label: "Заявки", icon: FileText },
  { href: "/notifications", label: "Уведомления", icon: Bell },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ student, unread, children }: { student: Student; unread: number; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = [...NAV, { href: "/profile", label: "Профиль", icon: User } as const];

  return (
    <SidebarProvider persist={false} width="15rem" className="min-h-dvh bg-background text-foreground">
      <Sidebar>
        <SidebarContent className="pt-4">
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<FastLink href={item.href} />}
                  icon={item.icon}
                  isActive={isActive(pathname, item.href)}
                >
                  {item.label}
                </SidebarMenuButton>
                {item.href === "/notifications" && unread > 0 && (
                  <SidebarMenuBadge>{unread}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarUserFooter
            name={student.name}
            avatar={
              <span
                className="flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--fluid-accent, #6B97FF), oklch(0.5 0.15 285))" }}
              >
                {initials(student.name)}
              </span>
            }
            menu={
              <>
                <MenuItem
                  index={0}
                  icon={User}
                  label="Профиль"
                  onSelect={() => router.push("/profile")}
                />
                <ThemeMenuItem index={1} />
                <MenuItem index={2} icon={LogOut} label="Выйти" onSelect={() => logoutAction()} />
              </>
            }
          />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-1">
            <SidebarTrigger aria-label="Меню" />
            <FastLink href="/" className="flex items-center gap-2 px-1">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </span>
              <span className="text-[length:var(--fs-title,16px)] leading-[var(--lh-title,22px)] font-semibold tracking-tight">
                Деканат
              </span>
            </FastLink>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <FastLink
              href="/profile"
              aria-label="Профиль"
              className="flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--fluid-accent, #6B97FF), oklch(0.5 0.15 285))" }}
            >
              {initials(student.name)}
            </FastLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>

        {/* Mobile bottom tabbar */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
          <div className="grid grid-cols-5">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <FastLink
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center gap-0.5 py-2"
                >
                  <span className="relative">
                    <item.icon
                      className={active ? "size-5 text-foreground" : "size-5 text-muted-foreground"}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {item.href === "/notifications" && unread > 0 && (
                      <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      active
                        ? "text-[10px] leading-3 font-semibold text-foreground"
                        : "text-[10px] leading-3 font-normal text-muted-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </FastLink>
              );
            })}
          </div>
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
