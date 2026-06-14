export type DateGroupBy = "day" | "week" | "month";

export const getWeekNumber = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
};

export const getTimezoneOffsetMs = (date: Date, timeZone: string): number => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap = new Map(parts.map((p) => [p.type, p.value]));

  const year = parseInt(partMap.get("year")!, 10);
  const month = parseInt(partMap.get("month")!, 10);
  const day = parseInt(partMap.get("day")!, 10);
  const hour = parseInt(partMap.get("hour")!, 10);
  const minute = parseInt(partMap.get("minute")!, 10);
  const second = parseInt(partMap.get("second")!, 10);

  const utcDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.000Z`;
  const targetUtcTime = new Date(utcDateStr).getTime();

  return targetUtcTime - date.getTime();
};

export const getStartOfDayInTimezone = (dateString: string, timeZone: string): Date => {
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const utcMidnightTime = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const tempDate = new Date(utcMidnightTime);
  const offsetMs = getTimezoneOffsetMs(tempDate, timeZone);

  return new Date(utcMidnightTime - offsetMs);
};

export const getEndOfDayInTimezone = (dateString: string, timeZone: string): Date => {
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const utcAlmostMidnightTime = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  const tempDate = new Date(utcAlmostMidnightTime);
  const offsetMs = getTimezoneOffsetMs(tempDate, timeZone);

  return new Date(utcAlmostMidnightTime - offsetMs);
};

export const getGroupKey = (date: Date, groupBy: DateGroupBy): string => {
  const tz = process.env.APP_TIMEZONE ?? "Asia/Kolkata";
  const localDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // YYYY-MM-DD

  if (groupBy === "day") {
    return localDateStr;
  }

  if (groupBy === "month") {
    return localDateStr.slice(0, 7); // YYYY-MM
  }

  const parts = localDateStr.split("-");
  const localDateObj = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  const week = String(getWeekNumber(localDateObj)).padStart(2, "0");
  return `${parts[0]}-W${week}`;
};

export const getMondayOfCurrentWeek = (): Date => {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};
