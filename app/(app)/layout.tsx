import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentStudent } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data";
import { AppShell } from "@/components/app-shell";


export default async function AppLayout({ children }: { children: ReactNode }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  const unread = await getUnreadCount(student.id);
  return (
    <AppShell student={student} unread={unread}>
      {children}
    </AppShell>
  );
}
