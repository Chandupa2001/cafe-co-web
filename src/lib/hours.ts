// Open-now logic, always on Sri Lanka time wherever the visitor is.
const OPEN_MINUTE = 10 * 60;
const CLOSE_MINUTE = 20 * 60;

const colomboClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Colombo',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function getStatus(now: Date = new Date()): { open: boolean; label: string } {
  const parts = colomboClock.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);
  const current = hour * 60 + minute;

  if (current < OPEN_MINUTE) return { open: false, label: 'Opens at 10 AM' };
  if (current < CLOSE_MINUTE) return { open: true, label: 'Open now, until 8 PM' };
  return { open: false, label: 'Closed, opens at 10 AM' };
}
