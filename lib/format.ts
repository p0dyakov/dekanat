export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const WEEKDAYS_FULL = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTHS_NOM = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

export function isoToday(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toISO(d);
}

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function mondayOf(dateISO: string): string {
  const d = fromISO(dateISO);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toISO(d);
}

export function addDaysISO(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** "Пн, 24 ноября" */
export function formatDayTitle(iso: string): string {
  const d = fromISO(iso);
  const wd = WEEKDAYS_SHORT[(d.getDay() + 6) % 7];
  return `${wd}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** "24 ноября" */
export function formatDateShort(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** "24 ноября 2025" */
export function formatDateFull(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

export function weekdayIndex(iso: string): number {
  return (fromISO(iso).getDay() + 6) % 7;
}

export function relativeDayLabel(iso: string, todayISO: string): string {
  if (iso === todayISO) return "Сегодня";
  if (iso === addDaysISO(todayISO, 1)) return "Завтра";
  if (iso === addDaysISO(todayISO, -1)) return "Вчера";
  return formatDayTitle(iso);
}

export function relativeTime(isoDatetime: string): string {
  const then = new Date(isoDatetime).getTime();
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "вчера";
  if (diffD < 7) return plural(diffD, "день", "дня", "дней") + " назад";
  const d = new Date(isoDatetime);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export function monthName(m: number): string {
  return MONTHS_NOM[m];
}

export function minutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return bh * 60 + bm - (ah * 60 + am);
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
