import { hashPassword } from "./password";

export interface Db {
  all<T>(sql: string, ...params: unknown[]): Promise<T[]>;
  get<T>(sql: string, ...params: unknown[]): Promise<T | undefined>;
  run(sql: string, ...params: unknown[]): Promise<{ lastInsertRowid: number }>;
  exec(sql: string): Promise<void>;
}

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT NOT NULL,
      program TEXT NOT NULL,
      course INTEGER NOT NULL,
      group_name TEXT NOT NULL,
      student_number TEXT NOT NULL,
      email TEXT NOT NULL,
      curator TEXT NOT NULL,
      dean_office TEXT NOT NULL,
      dean_hours TEXT NOT NULL,
      dean_email TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schedule_entries (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      slot INTEGER NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      subject TEXT NOT NULL,
      kind TEXT NOT NULL,
      teacher TEXT NOT NULL,
      room TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'normal',
      orig_starts_at TEXT,
      orig_room TEXT,
      change_note TEXT
    );
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      semester TEXT NOT NULL,
      subject TEXT NOT NULL,
      kind TEXT NOT NULL,
      date TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      room TEXT NOT NULL,
      teacher TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      semester TEXT NOT NULL,
      subject TEXT NOT NULL,
      kind TEXT NOT NULL,
      grade TEXT,
      points INTEGER,
      credits INTEGER NOT NULL,
      teacher TEXT NOT NULL,
      attendance INTEGER
    );
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      number TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT,
      pickup TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      answer TEXT
    );
    CREATE TABLE IF NOT EXISTS request_events (
      id INTEGER PRIMARY KEY,
      request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      at TEXT NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT,
      created_at TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_schedule_student ON schedule_entries(student_id, date);
    CREATE INDEX IF NOT EXISTS idx_exams_student ON exams(student_id, date);
    CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
    CREATE INDEX IF NOT EXISTS idx_requests_student ON requests(student_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id);
`;

declare global {
  var __dekanatNodeDb: Db | undefined;
  var __dekanatSeeded: boolean | undefined;
}

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monday(weekOffset = 0) {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number, h = 9) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 12, 0, 0);
  return d.toISOString();
}

async function seed(db: Db) {
  const s1 = (
    await db.run(
      `INSERT INTO students (login, password_hash, name, faculty, program, course, group_name, student_number, email, curator, dean_office, dean_hours, dean_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "ivanova",
      hashPassword("dekanat2026"),
      "Алина Соколова",
      "Факультет информационных технологий",
      "Прикладная информатика",
      2,
      "ИВТ-24-1",
      "СТ-2024-01842",
      "a.sokolova@stud.dekanat.ru",
      "Ирина Ветрова",
      "Деканат ФИТ, каб. 214",
      "пн–пт 10:00–17:00",
      "dekanat-fit@univer.example.ru"
    )
  ).lastInsertRowid;

  const s2 = (
    await db.run(
      `INSERT INTO students (login, password_hash, name, faculty, program, course, group_name, student_number, email, curator, dean_office, dean_hours, dean_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "petrov",
      hashPassword("dekanat2026"),
      "Матвей Гордеев",
      "Факультет экономики и управления",
      "Экономика",
      3,
      "ЭК-23-2",
      "СТ-2023-00917",
      "m.gordeev@stud.dekanat.ru",
      "Павел Ордынцев",
      "Деканат ФЭМ, каб. 312",
      "пн–пт 10:00–17:00",
      "dekanat-fem@univer.example.ru"
    )
  ).lastInsertRowid;

  const at = (d: Date, add: number) => {
    const c = new Date(d);
    c.setDate(c.getDate() + add);
    return iso(c);
  };

  type Les = [slot: number, st: string, en: string, subj: string, kind: string, teach: string, room: string,
    status?: string, origSt?: string | null, origRoom?: string | null, note?: string | null];

  const w1: Record<number, Les[]> = {
    0: [
      [1, "09:00", "10:35", "Базы данных", "лекция", "Сорокина Е. М.", "3-204"],
      [2, "10:50", "12:25", "Базы данных", "лабораторная", "Сорокина Е. М.", "3-204"],
      [3, "13:40", "15:15", "Английский язык", "семинар", "Литвинова К. Р.", "1-112"],
    ],
    1: [
      [2, "10:50", "12:25", "Веб-разработка", "лекция", "Громов Д. А.", "2-301"],
      [3, "13:40", "15:15", "Веб-разработка", "лабораторная", "Громов Д. А.", "2-310", "moved", "12:25", "2-301", "Перенесено по просьбе преподавателя"],
      [4, "15:30", "17:05", "Математический анализ", "семинар", "Уваров Н. П.", "1-208"],
    ],
    2: [
      [1, "09:00", "10:35", "Математический анализ", "лекция", "Уваров Н. П.", "1-208"],
      [3, "13:40", "15:15", "Архитектура ЭВМ", "лекция", "Севостьянов А. Л.", "3-115", "substitute", null, null, "Вместо лекции ОС — болезнь преподавателя"],
      [4, "15:30", "17:05", "Операционные системы", "семинар", "Севостьянов А. Л.", "3-118", "cancelled", null, null, "Перенесено на следующую неделю"],
    ],
    3: [
      [2, "10:50", "12:25", "Физическая культура", "практика", "Мартьянов С. В.", "Спортзал"],
      [3, "13:40", "15:15", "Базы данных", "семинар", "Сорокина Е. М.", "3-204"],
    ],
    4: [
      [1, "09:00", "10:35", "Веб-разработка", "семинар", "Громов Д. А.", "2-310"],
      [2, "10:50", "12:25", "Проектный практикум", "практика", "Ковалёва М. С.", "4-402"],
    ],
    5: [
      [2, "10:50", "12:25", "Электив: дизайн интерфейсов", "семинар", "Родина В. А.", "Онлайн"],
    ],
  };
  const w2: Record<number, Les[]> = {
    0: [
      [1, "09:00", "10:35", "Макроэкономика", "лекция", "Тарасова Л. И.", "5-101"],
      [2, "10:50", "12:25", "Статистика", "семинар", "Рябинин О. К.", "5-107"],
      [3, "13:40", "15:15", "Английский язык", "семинар", "Воронец Т. П.", "4-215"],
    ],
    1: [
      [1, "09:00", "10:35", "Финансовый менеджмент", "лекция", "Савельева Р. Д.", "5-301", "moved", "09:00", "5-104", "Аудитория изменена"],
      [3, "13:40", "15:15", "Эконометрика", "лекция", "Рябинин О. К.", "5-107"],
      [4, "15:30", "17:05", "Эконометрика", "лабораторная", "Рябинин О. К.", "6-020"],
    ],
    2: [
      [2, "10:50", "12:25", "История экономических учений", "лекция", "Баранов Э. Ф.", "5-101"],
      [3, "13:40", "15:15", "Статистика", "лекция", "Рябинин О. К.", "5-107", "cancelled", null, null, "Занятие отменено, материал выложен в курс"],
    ],
    3: [
      [1, "09:00", "10:35", "Финансовый менеджмент", "семинар", "Савельева Р. Д.", "5-301"],
      [4, "15:30", "17:05", "Макроэкономика", "семинар", "Тарасова Л. И.", "5-101"],
    ],
    4: [
      [2, "10:50", "12:25", "Бухгалтерский учёт", "лекция", "Новикова А. С.", "6-118"],
      [3, "13:40", "15:15", "Бухгалтерский учёт", "практика", "Новикова А. С.", "6-118"],
    ],
    5: [],
  };

  const ov1full: Record<string, [status: string, origSt: string | null, origRoom: string | null, note: string]> = {
    "1-3": ["moved", "10:50", "2-301", "Перенесено из-за конференции преподавателей"],
    "3-3": ["cancelled", null, null, "Преподаватель на конференции, материал в курсе"],
  };
  const ov2full: Record<string, [status: string, origSt: string | null, origRoom: string | null, note: string]> = {
    "0-2": ["moved", "10:50", "5-107", "Совмещено с семинаром по статистике"],
    "4-3": ["cancelled", null, null, "Перенесено на неделю позже"],
  };

  const SCHED_SQL = `INSERT INTO schedule_entries (student_id, date, slot, starts_at, ends_at, subject, kind, teacher, room, status, orig_starts_at, orig_room, change_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const seedWeek = async (
    sid: number,
    week: Record<number, Les[]>,
    weekOffset: number,
    overrides: Record<string, [string, string | null, string | null, string]> = {}
  ) => {
    const m = monday(weekOffset);
    for (const [day, lessons] of Object.entries(week)) {
      for (const l of lessons) {
        const ov = weekOffset === 1 ? overrides[`${day}-${l[0]}`] : undefined;
        const status = ov ? ov[0] : weekOffset === 0 ? l[7] ?? "normal" : "normal";
        const origSt = ov ? ov[1] : weekOffset === 0 ? l[8] ?? null : null;
        const origRoom = ov ? ov[2] : weekOffset === 0 ? l[9] ?? null : null;
        const note = ov ? ov[3] : weekOffset === 0 ? l[10] ?? null : null;
        await db.run(SCHED_SQL, sid, at(m, Number(day)), l[0], l[1], l[2], l[3], l[4], l[5], l[6], status, origSt, origRoom, note);
      }
    }
  };

  for (const off of [-2, -1, 0, 1, 2, 3]) await seedWeek(s1, w1, off, ov1full);
  for (const off of [-2, -1, 0, 1, 2, 3]) await seedWeek(s2, w2, off, ov2full);

  const sess = "Зимняя сессия 2025/26";
  const EXAM_SQL = `INSERT INTO exams (student_id, semester, subject, kind, date, starts_at, room, teacher)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const e1: [subj: string, kind: string, wk: number, day: number, st: string, room: string, t: string][] = [
    ["Веб-разработка", "консультация", 8, 0, "12:00", "2-310", "Громов Д. А."],
    ["Веб-разработка", "экзамен", 8, 1, "09:00", "2-310", "Громов Д. А."],
    ["Базы данных", "экзамен", 8, 3, "09:00", "3-204", "Сорокина Е. М."],
    ["Математический анализ", "консультация", 8, 6, "14:00", "1-208", "Уваров Н. П."],
    ["Математический анализ", "экзамен", 9, 0, "09:00", "1-208", "Уваров Н. П."],
    ["Архитектура ЭВМ", "зачёт", 9, 2, "11:00", "3-115", "Севостьянов А. Л."],
    ["Английский язык", "зачёт", 9, 4, "10:00", "1-112", "Литвинова К. Р."],
  ];
  const e2: [subj: string, kind: string, wk: number, day: number, st: string, room: string, t: string][] = [
    ["Статистика", "консультация", 8, 0, "12:00", "5-107", "Рябинин О. К."],
    ["Статистика", "экзамен", 8, 1, "09:00", "5-107", "Рябинин О. К."],
    ["Финансовый менеджмент", "экзамен", 8, 4, "09:00", "5-301", "Савельева Р. Д."],
    ["Макроэкономика", "экзамен", 9, 1, "09:00", "5-101", "Тарасова Л. И."],
    ["Эконометрика", "экзамен", 9, 3, "09:00", "6-020", "Рябинин О. К."],
    ["Бухгалтерский учёт", "зачёт", 9, 5, "12:00", "6-118", "Новикова А. С."],
  ];
  for (const e of e1) await db.run(EXAM_SQL, s1, sess, e[0], e[1], at(monday(e[2]), e[3]), e[4], e[5], e[6]);
  for (const e of e2) await db.run(EXAM_SQL, s2, sess, e[0], e[1], at(monday(e[2]), e[3]), e[4], e[5], e[6]);

  const GRADE_SQL = `INSERT INTO grades (student_id, semester, subject, kind, grade, points, credits, teacher, attendance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const g1: [sem: string, subj: string, kind: string, grade: string | null, pts: number | null, cr: number, t: string, att?: number | null][] = [
    ["Осень 2025/26", "Базы данных", "экзамен", null, 78, 5, "Сорокина Е. М.", 92],
    ["Осень 2025/26", "Веб-разработка", "экзамен", null, 85, 4, "Громов Д. А.", 88],
    ["Осень 2025/26", "Математический анализ", "экзамен", null, 64, 6, "Уваров Н. П.", 76],
    ["Осень 2025/26", "Архитектура ЭВМ", "зачёт", null, 71, 3, "Севостьянов А. Л.", 84],
    ["Осень 2025/26", "Английский язык", "зачёт", null, 90, 2, "Литвинова К. Р.", 96],
    ["Осень 2025/26", "Электив: дизайн интерфейсов", "диф. зачёт", null, 88, 2, "Родина В. А.", 94],
    ["Весна 2024/25", "Программирование", "экзамен", "5", null, 6, "Громов Д. А."],
    ["Весна 2024/25", "Линейная алгебра", "экзамен", "4", null, 5, "Уваров Н. П."],
    ["Весна 2024/25", "История", "зачёт", "зачёт", null, 2, "Орлова Т. Н."],
    ["Весна 2024/25", "Базы данных (вводный курс)", "диф. зачёт", "4", null, 3, "Сорокина Е. М."],
    ["Осень 2024/25", "Алгоритмы и структуры данных", "экзамен", "5", null, 6, "Севостьянов А. Л."],
    ["Осень 2024/25", "Математический анализ", "экзамен", "4", null, 6, "Уваров Н. П."],
    ["Осень 2024/25", "Иностранный язык", "зачёт", "зачёт", null, 2, "Литвинова К. Р."],
  ];
  const g2: [sem: string, subj: string, kind: string, grade: string | null, pts: number | null, cr: number, t: string, att?: number | null][] = [
    ["Осень 2025/26", "Макроэкономика", "экзамен", null, 82, 5, "Тарасова Л. И.", 90],
    ["Осень 2025/26", "Статистика", "экзамен", null, 69, 5, "Рябинин О. К.", 72],
    ["Осень 2025/26", "Финансовый менеджмент", "экзамен", null, 91, 4, "Савельева Р. Д.", 95],
    ["Осень 2025/26", "Эконометрика", "экзамен", null, 74, 4, "Рябинин О. К.", 81],
    ["Осень 2025/26", "Бухгалтерский учёт", "зачёт", null, 88, 3, "Новикова А. С.", 87],
    ["Весна 2024/25", "Микроэкономика", "экзамен", "4", null, 5, "Тарасова Л. И."],
    ["Весна 2024/25", "Маркетинг", "экзамен", "5", null, 4, "Лебедева И. О."],
    ["Весна 2024/25", "Деловой английский", "зачёт", "зачёт", null, 2, "Воронец Т. П."],
    ["Осень 2024/25", "Теория вероятностей", "экзамен", "3", null, 5, "Рябинин О. К."],
    ["Осень 2024/25", "Экономическая теория", "экзамен", "4", null, 5, "Баранов Э. Ф."],
  ];
  for (const g of g1) await db.run(GRADE_SQL, s1, g[0], g[1], g[2], g[3], g[4], g[5], g[6], g[7] ?? null);
  for (const g of g2) await db.run(GRADE_SQL, s2, g[0], g[1], g[2], g[3], g[4], g[5], g[6], g[7] ?? null);

  const REQ_SQL = `INSERT INTO requests (student_id, number, kind, title, detail, pickup, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const EV_SQL = `INSERT INTO request_events (request_id, status, at, note) VALUES (?, ?, ?, ?)`;

  const r1 = (await db.run(REQ_SQL, s1, "СП-0412", "справка", "Справка об обучении",
    "Для предъявления по месту требования", "Деканат ФИТ, каб. 214",
    "ready", daysAgo(4, 11))).lastInsertRowid;
  await db.run(EV_SQL, r1, "submitted", daysAgo(4, 11), "Заявка принята системой");
  await db.run(EV_SQL, r1, "accepted", daysAgo(4, 14), "Проверено деканатом");
  await db.run(EV_SQL, r1, "in_progress", daysAgo(3, 10), "Справка на подписи");
  await db.run(EV_SQL, r1, "ready", daysAgo(1, 15), "Можно забрать в деканате ФИТ, каб. 214, пн–пт 10:00–17:00");

  const r2 = (await db.run(REQ_SQL, s1, "ЗВ-1038", "заявление", "Заявление на материальную помощь",
    "Прошу рассмотреть назначение материальной помощи в связи с трудной жизненной ситуацией. Документы прилагаются.",
    null, "in_progress", daysAgo(2, 16))).lastInsertRowid;
  await db.run(EV_SQL, r2, "submitted", daysAgo(2, 16), "Заявка принята системой");
  await db.run(EV_SQL, r2, "accepted", daysAgo(1, 9), "Проверено деканатом");
  await db.run(EV_SQL, r2, "in_progress", daysAgo(0, 8), "На рассмотрении комиссии");

  const r3 = (await db.run(REQ_SQL, s1, "СП-0377", "справка", "Справка для военкомата",
    "Форма 26, для военкомата", null, "rejected", daysAgo(9, 13))).lastInsertRowid;
  await db.run(EV_SQL, r3, "submitted", daysAgo(9, 13), "Заявка принята системой");
  await db.run(EV_SQL, r3, "rejected", daysAgo(8, 10), "Справку формы 26 оформляет военный учётный стол, каб. 118");

  const r4 = (await db.run(REQ_SQL, s2, "СП-0290", "справка", "Справка об обучении",
    "Для стипендиального отдела банка", "Деканат ФЭМ, каб. 312",
    "in_progress", daysAgo(1, 10))).lastInsertRowid;
  await db.run(EV_SQL, r4, "submitted", daysAgo(1, 10), "Заявка принята системой");
  await db.run(EV_SQL, r4, "accepted", daysAgo(1, 12), "Проверено деканатом");
  await db.run(EV_SQL, r4, "in_progress", daysAgo(0, 9), "Справка на подписи");

  const r5 = (await db.run(REQ_SQL, s2, "ЗВ-0988", "заявление", "Заявление на академический отпуск",
    "Прошу предоставить академический отпуск по семейным обстоятельствам с 02.02.2026.",
    null, "ready", daysAgo(12, 14))).lastInsertRowid;
  await db.run(EV_SQL, r5, "submitted", daysAgo(12, 14), "Заявка принята системой");
  await db.run(EV_SQL, r5, "accepted", daysAgo(11, 11), "Проверено деканатом");
  await db.run(EV_SQL, r5, "in_progress", daysAgo(10, 15), "На рассмотрении");
  await db.run(EV_SQL, r5, "ready", daysAgo(7, 16), "Приказ издан. Подписать и забрать копию в деканате ФЭМ, каб. 312");

  const r6 = (await db.run(REQ_SQL, s1, "ВП-0144", "вопрос", "Можно ли сдать курсовую досрочно?",
    "Хочу защитить курсовую по базам данных до начала сессии — есть ли такая возможность?",
    null, "ready", daysAgo(5, 12))).lastInsertRowid;
  await db.run(EV_SQL, r6, "submitted", daysAgo(5, 12), "Вопрос принят системой");
  await db.run(EV_SQL, r6, "accepted", daysAgo(5, 15), "Передано в деканат");
  await db.run(EV_SQL, r6, "ready", daysAgo(3, 11), "Деканат ответил на вопрос");
  await db.run("UPDATE requests SET answer = ? WHERE id = ?",
    "Досрочная защита возможна до 15 декабря. Запишитесь к куратору Ирине Ветровой, каб. 214 — она согласует дату с кафедрой.",
    r6);

  const r7 = (await db.run(REQ_SQL, s2, "ВП-0151", "вопрос", "Когда появится расписание зимней сессии?",
    "В кабинете пока нет дат экзаменов по эконометрике — когда их опубликуют?",
    null, "in_progress", daysAgo(1, 14))).lastInsertRowid;
  await db.run(EV_SQL, r7, "submitted", daysAgo(1, 14), "Вопрос принят системой");
  await db.run(EV_SQL, r7, "accepted", daysAgo(1, 17), "Передано в деканат");
  await db.run(EV_SQL, r7, "in_progress", daysAgo(0, 9), "Уточняем у кафедры");

  const NOTIF_SQL = `INSERT INTO notifications (student_id, type, title, body, href, created_at, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const n1: [type: string, title: string, body: string, href: string | null, at: string, read: number][] = [
    ["schedule", "Пара перенесена", "Веб-разработка во вторник перенесена с 12:25 на 13:40, аудитория 2-310.", "/schedule", daysAgo(0, 7), 0],
    ["request", "Справка готова", "Справку об обучении можно забрать в деканате ФИТ, каб. 214.", "/requests", daysAgo(1, 15), 0],
    ["deadline", "Дедлайн по курсовой", "Загрузить план курсовой по базам данных нужно до пятницы.", "/grades", daysAgo(1, 10), 0],
    ["news", "Объявление деканата", "В четверг консультация по курсовым проектам в каб. 214, 15:00–17:00.", null, daysAgo(2, 9), 1],
    ["schedule", "Замена занятия", "В среду вместо лекции ОС будет лекция по архитектуре ЭВМ.", "/schedule", daysAgo(2, 8), 1],
    ["deadline", "Стипендиальные документы", "До 5 декабря принимаются заявления на повышенную стипендию.", "/requests", daysAgo(4, 11), 1],
  ];
  const n2: [type: string, title: string, body: string, href: string | null, at: string, read: number][] = [
    ["schedule", "Аудитория изменена", "Лекция по финансовому менеджменту пройдёт в ауд. 5-301.", "/schedule", daysAgo(0, 8), 0],
    ["request", "Заявка в работе", "Справка об обучении подписывается, ориентировочно готова завтра.", "/requests", daysAgo(0, 9), 0],
    ["deadline", "Запись на пересдачу", "До 28 ноября открыта запись на пересдачу по теории вероятностей.", "/grades", daysAgo(2, 13), 0],
    ["news", "Объявление деканата", "График работы деканата в праздники: 4 ноября — выходной.", null, daysAgo(3, 10), 1],
  ];
  for (const n of n1) await db.run(NOTIF_SQL, s1, ...n);
  for (const n of n2) await db.run(NOTIF_SQL, s2, ...n);
}

interface D1Prepared {
  bind(...params: unknown[]): D1Prepared;
  all(): Promise<{ results: unknown[] }>;
  first(): Promise<unknown>;
  run(): Promise<{ meta: { last_row_id: number } }>;
}
interface D1Like {
  prepare(sql: string): D1Prepared;
  exec(sql: string): Promise<unknown>;
}

async function createD1Db(): Promise<Db | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const d1 = (env as Record<string, unknown>).DB as D1Like | undefined;
    if (!d1) return null;
    const db: Db = {
      all: async (sql, ...p) => ((await d1.prepare(sql).bind(...p).all()).results as never),
      get: async (sql, ...p) => ((await d1.prepare(sql).bind(...p).first()) as never) ?? undefined,
      run: async (sql, ...p) => {
        const r = await d1.prepare(sql).bind(...p).run();
        return { lastInsertRowid: r.meta.last_row_id };
      },
      exec: async (sql) => {
        await d1.exec(sql);
      },
    };
    return db;
  } catch {
    return null;
  }
}

async function createNodeDb(): Promise<Db> {
  const { DatabaseSync } = await import("node:sqlite");
  const { mkdirSync } = await import("node:fs");
  const path = await import("node:path");
  const DB_PATH = path.join(process.cwd(), "data", "dekanat.db");
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new DatabaseSync(DB_PATH);
  sqlite.exec("PRAGMA journal_mode = WAL");
  const db: Db = {
    all: async (sql, ...p) => sqlite.prepare(sql).all(...(p as never[])) as never,
    get: async (sql, ...p) => (sqlite.prepare(sql).get(...(p as never[])) as never) ?? undefined,
    run: async (sql, ...p) => sqlite.prepare(sql).run(...(p as never[])) as { lastInsertRowid: number },
    exec: async (sql) => {
      sqlite.exec(sql);
    },
  };
  return db;
}

export async function getDb(): Promise<Db> {
  // В Workers промисы не могут «дожить» до следующего запроса —
  // поэтому D1-биндинг берём свежим на каждый запрос, а кешируем только значения.
  const db = (await createD1Db()) ?? (globalThis.__dekanatNodeDb ??= await createNodeDb());
  if (!globalThis.__dekanatSeeded) {
    for (const stmt of SCHEMA.split(";")) {
      const sql = stmt.trim();
      if (sql) await db.run(sql);
    }
    const count = await db.get<{ c: number }>("SELECT COUNT(*) AS c FROM students");
    if (!count || count.c === 0) {
      try {
        await seed(db);
      } catch {
        // параллельный запрос засидал первым — игнорируем
      }
    }
    globalThis.__dekanatSeeded = true;
  }
  return db;
}
