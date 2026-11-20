import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WEEKDAYS_FULL,
  WEEKDAYS_SHORT,
  addDaysISO,
  formatDateFull,
  formatDateShort,
  formatDayTitle,
  formatDuration,
  fromISO,
  isoToday,
  minutesBetween,
  mondayOf,
  monthName,
  plural,
  relativeDayLabel,
  relativeTime,
  toISO,
  weekdayIndex,
} from "./format.ts";

describe("ISO date helpers", () => {
  it("converts between local dates and ISO calendar dates", () => {
    const date = new Date(2025, 10, 24, 12);

    assert.equal(toISO(date), "2025-11-24");
    assert.deepEqual(fromISO("2025-11-24"), new Date(2025, 10, 24));
  });

  it("returns today and offsets from the current local date", (context) => {
    const now = new Date(2025, 10, 24, 12);
    context.mock.timers.enable({ apis: ["Date"], now });

    assert.equal(isoToday(), "2025-11-24");
    assert.equal(isoToday(1), "2025-11-25");
    assert.equal(isoToday(-1), "2025-11-23");
  });

  it("adds and subtracts days across month, year, and leap-day boundaries", () => {
    assert.equal(addDaysISO("2025-12-31", 1), "2026-01-01");
    assert.equal(addDaysISO("2024-02-28", 1), "2024-02-29");
    assert.equal(addDaysISO("2024-03-01", -1), "2024-02-29");
  });

  it("finds the Monday at the start of the week for every weekday", () => {
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(2025, 10, 24 + day, 12);
      assert.equal(mondayOf(toISO(date)), "2025-11-24");
    }
  });

  it("uses Monday-first weekday indexes", () => {
    assert.deepEqual(
      Array.from({ length: 7 }, (_, day) => weekdayIndex(toISO(new Date(2025, 10, 24 + day, 12)))),
      [0, 1, 2, 3, 4, 5, 6],
    );
  });
});

describe("Russian date labels", () => {
  it("exports Monday-first short and full weekday names", () => {
    assert.deepEqual(WEEKDAYS_SHORT, ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
    assert.deepEqual(WEEKDAYS_FULL, ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]);
  });

  it("formats day titles and short and full dates", () => {
    assert.equal(formatDayTitle("2025-11-24"), "Пн, 24 ноября");
    assert.equal(formatDateShort("2025-02-03"), "3 февраля");
    assert.equal(formatDateFull("2025-01-01"), "1 января 2025");
  });

  it("formats all nominative month names", () => {
    assert.deepEqual(
      Array.from({ length: 12 }, (_, month) => monthName(month)),
      ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
    );
  });

  it("labels today, adjacent days, and other dates", () => {
    assert.equal(relativeDayLabel("2025-11-24", "2025-11-24"), "Сегодня");
    assert.equal(relativeDayLabel("2025-11-25", "2025-11-24"), "Завтра");
    assert.equal(relativeDayLabel("2025-11-23", "2025-11-24"), "Вчера");
    assert.equal(relativeDayLabel("2025-11-26", "2025-11-24"), "Ср, 26 ноября");
  });
});

describe("relative time", () => {
  it("formats recent minute and hour intervals", (context) => {
    const now = new Date(2025, 10, 24, 12);
    context.mock.timers.enable({ apis: ["Date"], now });
    const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

    assert.equal(relativeTime(minutesAgo(0)), "только что");
    assert.equal(relativeTime(minutesAgo(2)), "2 мин назад");
    assert.equal(relativeTime(minutesAgo(59)), "59 мин назад");
    assert.equal(relativeTime(minutesAgo(90)), "2 ч назад");
    assert.equal(relativeTime(minutesAgo(23 * 60 + 30)), "вчера");
  });

  it("formats yesterday, plural day counts, and older calendar dates", (context) => {
    const now = new Date(2025, 10, 24, 12);
    context.mock.timers.enable({ apis: ["Date"], now });
    const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

    assert.equal(relativeTime(minutesAgo(24 * 60)), "вчера");
    assert.equal(relativeTime(minutesAgo(2 * 24 * 60)), "2 дня назад");
    assert.equal(relativeTime(minutesAgo(5 * 24 * 60)), "5 дней назад");
    assert.equal(relativeTime(minutesAgo(7 * 24 * 60)), "17 ноября");
  });
});

describe("number and duration formatting", () => {
  it("uses Russian singular, paucal, and plural forms including teens", () => {
    assert.equal(plural(1, "день", "дня", "дней"), "1 день");
    assert.equal(plural(2, "день", "дня", "дней"), "2 дня");
    assert.equal(plural(4, "день", "дня", "дней"), "4 дня");
    assert.equal(plural(5, "день", "дня", "дней"), "5 дней");
    assert.equal(plural(11, "день", "дня", "дней"), "11 дней");
    assert.equal(plural(21, "день", "дня", "дней"), "21 день");
    assert.equal(plural(24, "день", "дня", "дней"), "24 дня");
  });

  it("calculates the difference between clock times in minutes", () => {
    assert.equal(minutesBetween("09:15", "10:45"), 90);
    assert.equal(minutesBetween("10:45", "09:15"), -90);
  });

  it("formats durations with hours, minutes, or both", () => {
    assert.equal(formatDuration(0), "0 мин");
    assert.equal(formatDuration(45), "45 мин");
    assert.equal(formatDuration(120), "2 ч");
    assert.equal(formatDuration(125), "2 ч 5 мин");
  });
});
