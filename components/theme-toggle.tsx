"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/components/ui/menu-item";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

function useTheme() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  return { dark, toggle };
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-surface-2 text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground",
        className
      )}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function ThemeMenuItem({ index }: { index: number }) {
  const { dark, toggle } = useTheme();
  return (
    <MenuItem
      index={index}
      icon={dark ? Sun : Moon}
      label={dark ? "Светлая тема" : "Тёмная тема"}
      onSelect={toggle}
    />
  );
}
