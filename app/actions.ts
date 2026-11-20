"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, getCurrentStudent } from "@/lib/auth";

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!login || !password) {
    return { error: "Введите логин и пароль" };
  }
  const db = await getDb();
  const row = await db.get<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM students WHERE login = ?",
    login
  );
  if (!row || !verifyPassword(password, row.password_hash)) {
    return { error: "Неверный логин или пароль" };
  }
  await createSession(row.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function markNotificationRead(id: number) {
  const student = await getCurrentStudent();
  if (!student) return;
  const db = await getDb();
  await db.run("UPDATE notifications SET read = 1 WHERE id = ? AND student_id = ?", id, student.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const student = await getCurrentStudent();
  if (!student) return;
  const db = await getDb();
  await db.run("UPDATE notifications SET read = 1 WHERE student_id = ? AND read = 0", student.id);
  revalidatePath("/notifications");
}

const CERT_TYPES = [
  "Справка об обучении",
  "Справка для военкомата",
  "Справка о стипендии",
  "Справка в соцзащиту",
] as const;

export async function createRequestAction(_prev: { error?: string } | null, formData: FormData) {
  const student = await getCurrentStudent();
  if (!student) return { error: "Сессия истекла, войдите заново" };

  const kind = String(formData.get("kind") ?? "справка");
  const pickup = String(formData.get("pickup") ?? "").trim() || null;
  const detail = String(formData.get("detail") ?? "").trim() || null;

  let title: string;
  if (kind === "справка") {
    const cert = String(formData.get("cert_type") ?? "");
    if (!CERT_TYPES.includes(cert as (typeof CERT_TYPES)[number])) {
      return { error: "Выберите тип справки" };
    }
    title = cert;
    if (!pickup) return { error: "Выберите способ получения" };
  } else {
    const topic = String(formData.get("title") ?? "").trim();
    if (topic.length < 5) return { error: kind === "вопрос" ? "Укажите тему вопроса" : "Укажите тему заявления" };
    if (!detail || detail.length < 10) {
      return { error: kind === "вопрос" ? "Напишите вопрос — минимум пару предложений" : "Напишите текст заявления — минимум пару предложений" };
    }
    title = topic;
  }

  const db = await getDb();
  const prefix = kind === "справка" ? "СП" : kind === "вопрос" ? "ВП" : "ЗВ";
  const count = await db.get<{ c: number }>("SELECT COUNT(*) AS c FROM requests");
  const seq = (count?.c ?? 0) + 1;
  const number = `${prefix}-${String(420 + seq).padStart(4, "0")}`;
  const now = new Date().toISOString();

  const res = await db.run(
    `INSERT INTO requests (student_id, number, kind, title, detail, pickup, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)`,
    student.id, number, kind, title, detail, pickup, now
  );
  await db.run(
    "INSERT INTO request_events (request_id, status, at, note) VALUES (?, 'submitted', ?, ?)",
    res.lastInsertRowid,
    now,
    "Заявка принята системой"
  );
  revalidatePath("/requests");
  redirect("/requests?created=1");
}
