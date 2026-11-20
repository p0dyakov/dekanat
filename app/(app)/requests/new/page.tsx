import type { Metadata } from "next";
import { FastLink } from "@fast-link/next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentStudent } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";
import { RequestForm } from "@/components/request-form";

export const metadata: Metadata = { title: "Новая заявка — Деканат" };


export default async function NewRequestPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  return (
    <div className="reveal-product mx-auto flex max-w-lg flex-col gap-5">
      <div>
        <FastLink
          href="/requests"
          className={cn("mb-3 inline-flex items-center gap-1.5", typeClass("caption"), "text-muted-foreground hover:text-foreground")}
        >
          <ArrowLeft className="size-3.5" /> К заявкам
        </FastLink>
        <h1 className={cn(typeClass("display"), "font-semibold tracking-tight")}>Новая заявка</h1>
      </div>
      <RequestForm />
    </div>
  );
}
