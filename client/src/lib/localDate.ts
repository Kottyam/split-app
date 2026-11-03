/** YYYY-MM-DD in the device's local time zone (toISOString() uses UTC and is a day behind in IST before 05:30). */
export function toLocalDateKey(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
