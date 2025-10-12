export const startOfTodayLocal = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

export const endOfTodayLocal = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
};

export const lastNDaysLocal = (n: number) => {
  const days: Date[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
};

export const formatDayLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const toISO = (d: Date) => d.toISOString();
