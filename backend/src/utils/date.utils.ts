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

export const getGroupKey = (date: Date, groupBy: DateGroupBy): string => {
  if (groupBy === "day") {
    return date.toISOString().split("T")[0];
  }

  if (groupBy === "month") {
    return date.toISOString().slice(0, 7);
  }

  const week = String(getWeekNumber(date)).padStart(2, "0");
  return `${date.getFullYear()}-W${week}`;
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
