import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") return notFound();
  const login = req.nextUrl.searchParams.get("u") ?? "ivanova";
  const to = req.nextUrl.searchParams.get("to") ?? "/";
  if (!to.startsWith("/") || to.startsWith("//")) return notFound();
  const db = await getDb();
  const student = await db.get<{ id: number }>(
    "SELECT id FROM students WHERE login = ?",
    login
  );
  if (!student) return notFound();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 86400_000).toISOString();
  await db.run(
    "INSERT INTO sessions (token, student_id, expires_at) VALUES (?, ?, ?)",
    token,
    student.id,
    expires
  );
  const res = NextResponse.redirect(new URL(to, req.url));
  res.cookies.set("dekanat_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
  return res;
}
