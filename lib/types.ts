export interface Student {
  id: number;
  login: string;
  name: string;
  faculty: string;
  program: string;
  course: number;
  group_name: string;
  student_number: string;
  email: string;
  curator: string;
  dean_office: string;
  dean_hours: string;
  dean_email: string;
}

export interface ScheduleEntry {
  id: number;
  student_id: number;
  date: string;
  slot: number;
  starts_at: string;
  ends_at: string;
  subject: string;
  kind: string;
  teacher: string;
  room: string;
  status: "normal" | "moved" | "cancelled" | "substitute";
  orig_starts_at: string | null;
  orig_room: string | null;
  change_note: string | null;
}

export interface Grade {
  id: number;
  student_id: number;
  semester: string;
  subject: string;
  kind: string;
  grade: string | null;
  points: number | null;
  credits: number;
  teacher: string;
  attendance: number | null;
}

export interface Exam {
  id: number;
  student_id: number;
  semester: string;
  subject: string;
  kind: "экзамен" | "зачёт" | "консультация";
  date: string;
  starts_at: string;
  room: string;
  teacher: string;
}

export type RequestStatus = "submitted" | "accepted" | "in_progress" | "ready" | "rejected";

export interface StudentRequest {
  id: number;
  student_id: number;
  number: string;
  kind: string;
  title: string;
  detail: string | null;
  pickup: string | null;
  status: RequestStatus;
  created_at: string;
  answer: string | null;
}

export interface RequestEvent {
  id: number;
  request_id: number;
  status: RequestStatus;
  at: string;
  note: string | null;
}

export type NotificationType = "schedule" | "request" | "deadline" | "news";

export interface AppNotification {
  id: number;
  student_id: number;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  created_at: string;
  read: number;
}
