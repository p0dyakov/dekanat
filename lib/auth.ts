import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { getDb } from "./db";
import type { Student } from "./types";

const COOKIE = "dekanat_session";
const SESSION_DAYS = 30;

export async function createSession(studentId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  const db = await getDb();
  await db.run(
    "INSERT INTO sessions (token, student_id, expires_at) VALUES (?, ?, ?)",
    token,
    studentId,
    expires
  );
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expires),
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.run("DELETE FROM sessions WHERE token = ?", token);
  }
  jar.delete(COOKIE);
}

export const getCurrentStudent = cache(async (): Promise<Student | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const row = await db.get<Student>(
    `SELECT s.id, s.login, s.name, s.faculty, s.program, s.course, s.group_name, s.student_number, s.email, s.curator, s.dean_office, s.dean_hours, s.dean_email
     FROM sessions se JOIN students s ON s.id = se.student_id
     WHERE se.token = ? AND se.expires_at > datetime('now')`,
    token
  );
  return row ? { ...row } : null;
});
