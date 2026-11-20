import "server-only";
import { getDb } from "./db";
import type { AppNotification, Exam, Grade, RequestEvent, ScheduleEntry, StudentRequest } from "./types";

export async function getScheduleForWeek(studentId: number, weekStartISO: string): Promise<ScheduleEntry[]> {
  const db = await getDb();
  const rows = await db.all<ScheduleEntry>(
    "SELECT * FROM schedule_entries WHERE student_id = ? AND date >= ? AND date < date(?, '+7 days') ORDER BY date, slot",
    studentId,
    weekStartISO,
    weekStartISO
  );
  return rows.map((r) => ({ ...r }));
}

export async function getGrades(studentId: number): Promise<Grade[]> {
  const db = await getDb();
  const rows = await db.all<Grade>(
    "SELECT * FROM grades WHERE student_id = ? ORDER BY semester DESC, id",
    studentId
  );
  return rows.map((r) => ({ ...r }));
}

export async function getExams(studentId: number): Promise<Exam[]> {
  const db = await getDb();
  const rows = await db.all<Exam>(
    "SELECT * FROM exams WHERE student_id = ? ORDER BY date, starts_at",
    studentId
  );
  return rows.map((r) => ({ ...r }));
}

export async function getRequests(studentId: number): Promise<StudentRequest[]> {
  const db = await getDb();
  const rows = await db.all<StudentRequest>(
    "SELECT * FROM requests WHERE student_id = ? ORDER BY created_at DESC",
    studentId
  );
  return rows.map((r) => ({ ...r }));
}

export async function getRequestEvents(requestIds: number[]): Promise<Record<number, RequestEvent[]>> {
  if (requestIds.length === 0) return {};
  const db = await getDb();
  const marks = requestIds.map(() => "?").join(",");
  const rows = await db.all<RequestEvent>(
    `SELECT * FROM request_events WHERE request_id IN (${marks}) ORDER BY at`,
    ...requestIds
  );
  const map: Record<number, RequestEvent[]> = {};
  for (const r of rows) {
    (map[r.request_id] ??= []).push({ ...r });
  }
  return map;
}

export async function getNotifications(studentId: number): Promise<AppNotification[]> {
  const db = await getDb();
  const rows = await db.all<AppNotification>(
    "SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC",
    studentId
  );
  return rows.map((r) => ({ ...r }));
}

export async function getUnreadCount(studentId: number): Promise<number> {
  const db = await getDb();
  const row = await db.get<{ c: number }>(
    "SELECT COUNT(*) AS c FROM notifications WHERE student_id = ? AND read = 0",
    studentId
  );
  return row?.c ?? 0;
}

export const REQUEST_STEPS: { key: string; label: string }[] = [
  { key: "submitted", label: "Подана" },
  { key: "accepted", label: "Принята" },
  { key: "in_progress", label: "В работе" },
  { key: "ready", label: "Готова" },
];

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  submitted: "Подана",
  accepted: "Принята",
  in_progress: "В работе",
  ready: "Готова",
  rejected: "Отклонена",
};
