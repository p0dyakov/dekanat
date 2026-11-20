"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, LogIn } from "lucide-react";
import { loginAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { motion } from "motion/react";

const TEST_PASSWORD = "dekanat2026";
const TEST_ACCOUNTS = [
  { login: "ivanova", name: "Алина Соколова", meta: "ИВТ-24-1, 2 курс" },
  { login: "petrov", name: "Матвей Гордеев", meta: "ЭК-23-2, 3 курс" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : "Войти"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [, startTransition] = useTransition();
  const [login, setLogin] = useState("");
  const [quick, setQuick] = useState<string | null>(null);

  const quickLogin = (value: string) => {
    setQuick(value);
    setLogin(value);
    const fd = new FormData();
    fd.set("login", value);
    fd.set("password", TEST_PASSWORD);
    startTransition(() => formAction(fd));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.slow}
      className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-surface-3 backdrop-blur-xl"
    >
      <form action={formAction} className="flex flex-col gap-3">
        <Input
          name="login"
          autoComplete="username"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoFocus
        />
        <Input name="password" type="password" autoComplete="current-password" placeholder="Пароль" />
        {state?.error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.fast}
            className="text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)] text-destructive"
          >
            {state.error}
          </motion.p>
        )}
        <SubmitButton />
      </form>

      <div className="mt-5 border-t border-border pt-4">
        <div className="grid grid-cols-2 gap-2">
          {TEST_ACCOUNTS.map((acc) => {
            const loading = pending && quick === acc.login;
            return (
              <button
                key={acc.login}
                type="button"
                onClick={() => quickLogin(acc.login)}
                disabled={pending}
                className={cn(
                  "group flex flex-col items-start gap-0.5 rounded-xl bg-surface-2 p-3 text-left",
                  "transition-colors hover:bg-surface-3 disabled:opacity-60"
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="font-mono text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)] font-medium">
                    {acc.login}
                  </span>
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <LogIn className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  )}
                </span>
                <span className="text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] font-medium">
                  {acc.name}
                </span>
                <span className="text-[length:var(--fs-micro,11px)] leading-[var(--lh-micro,14px)] text-muted-foreground">
                  {acc.meta}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
