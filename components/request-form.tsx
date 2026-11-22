"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { Loader2, MailOpen, ScrollText } from "lucide-react";
import { createRequestAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { typeClass } from "@/lib/type-scale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CERTS = ["Справка об обучении", "Справка для военкомата", "Справка о стипендии", "Справка в соцзащиту"];
const PICKUP = ["В деканате лично", "Электронно (PDF на почту)"];
const FIELD_FILL = "border-border bg-background hover:bg-background focus:hover:bg-background";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground",
        typeClass("body"),
        "font-medium transition-opacity disabled:opacity-60"
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Отправляем…" : "Подать заявку"}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
}) {
  return (
    <div className={cn("grid gap-1 rounded-xl bg-background p-1", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-lg px-3 py-2",
            typeClass("body"),
            "font-medium transition-colors",
            value === o ? "bg-card text-foreground shadow-surface-1" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function RequestForm() {
  const [state, formAction] = useActionState(createRequestAction, null);
  const [kind, setKind] = useState<"справка" | "заявление" | "вопрос">("справка");
  const [cert, setCert] = useState(CERTS[0]);
  const [pickup, setPickup] = useState(PICKUP[0]);

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <input type="hidden" name="kind" value={kind} />

      <Segmented value={kind} onChange={setKind} options={["справка", "заявление", "вопрос"]} />

      <div key={kind} className="flex flex-col gap-4">
        {kind === "справка" ? (
          <>
            <div>
              <p className={cn("mb-2", typeClass("body"), "font-medium")}>Какая справка нужна</p>
              <div className="flex flex-col gap-1.5">
                {CERTS.map((c) => (
                  <label
                    key={c}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border bg-surface-2 p-3 transition-colors",
                      cert === c ? "border-[color:var(--fluid-accent,#6B97FF)] bg-[color:var(--fluid-accent,#6B97FF)]/10" : "border-border hover:bg-surface-3"
                    )}
                  >
                    <input
                      type="radio"
                      name="cert_type"
                      value={c}
                      checked={cert === c}
                      onChange={() => setCert(c)}
                      className="size-4 accent-[var(--fluid-accent,#6B97FF)]"
                    />
                    <span className={cn(typeClass("body"), "flex items-center gap-2")}>
                      <ScrollText className="size-4 text-muted-foreground" />
                      {c}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className={cn("mb-2", typeClass("body"), "font-medium")}>Способ получения</p>
              <div className="flex flex-col gap-1.5">
                {PICKUP.map((p) => (
                  <label
                    key={p}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border bg-surface-2 p-3 transition-colors",
                      pickup === p ? "border-[color:var(--fluid-accent,#6B97FF)] bg-[color:var(--fluid-accent,#6B97FF)]/10" : "border-border hover:bg-surface-3"
                    )}
                  >
                    <input
                      type="radio"
                      name="pickup"
                      value={p}
                      checked={pickup === p}
                      onChange={() => setPickup(p)}
                      className="size-4 accent-[var(--fluid-accent,#6B97FF)]"
                    />
                    <span className={cn(typeClass("body"), "flex items-center gap-2")}>
                      <MailOpen className="size-4 text-muted-foreground" />
                      {p}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className={cn("mb-2", typeClass("body"), "font-medium")}>Комментарий <span className="font-normal text-muted-foreground">(необязательно)</span></p>
              <Input name="detail" placeholder="Например: для банка, два экземпляра" className={FIELD_FILL} />
            </div>
          </>
        ) : kind === "заявление" ? (
          <>
            <div>
              <p className={cn("mb-2", typeClass("body"), "font-medium")}>Тема заявления</p>
              <Input name="title" placeholder="Например: продление сессии по болезни" className={FIELD_FILL} />
            </div>
            <div>
              <p className={cn("mb-2", typeClass("body"), "font-medium")}>Текст заявления</p>
              <Textarea
                name="detail"
                rows={5}
                placeholder="Прошу рассмотреть…"
                className={cn("resize-none", FIELD_FILL)}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className={cn("mb-2", typeClass("body"), "font-medium")}>Тема вопроса</p>
              <Input name="title" placeholder="Например: перенос дедлайна по курсовой" className={FIELD_FILL} />
            </div>
            <div>
              <p className={cn("mb-2", typeClass("body"), "font-medium")}>Вопрос деканату</p>
              <Textarea
                name="detail"
                rows={4}
                placeholder="Опишите вопрос — ответ придёт в заявки и уведомления"
                className={cn("resize-none", FIELD_FILL)}
              />
            </div>
          </>
        )}
      </div>

      {state?.error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={spring.fast}
          className={cn(typeClass("caption"), "rounded-xl bg-destructive/10 p-3 text-destructive")}
        >
          {state.error}
        </motion.p>
      )}

      <Submit />
    </form>
  );
}
