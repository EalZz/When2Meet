export type MonthCell = {
  key: string;
  date: string | null;
  day: number | null;
  isToday: boolean;
};

export function formatDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMonthCells(year: number, monthIndex: number): MonthCell[] {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const cells: MonthCell[] = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      date: null,
      day: null,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = formatDateKey(year, monthIndex, day);
    cells.push({
      key: date,
      date,
      day,
      isToday: date === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      date: null,
      day: null,
      isToday: false,
    });
  }

  return cells;
}
