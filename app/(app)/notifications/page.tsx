import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { cn } from "@/lib/utils";
import { typeClass } from "@/lib/type-scale";
import { NotificationsView } from "@/components/notifications-view";

export const metadata: Metadata = { title: "Уведомления — Деканат" };


export default async function NotificationsPage() {
  await connection();
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  const items = await getNotifications(student.id);

  return (
    <div className="reveal-product flex flex-col gap-5">
      <header>
        <h1 className={cn(typeClass("display"), "font-semibold tracking-tight")}>Уведомления</h1>
      </header>
      <NotificationsView items={items} />
    </div>
  );
}
