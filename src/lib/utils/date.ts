/**
 * Date and Time utilities strictly for Asia/Jakarta (WIB) timezone
 */

export function getWIBDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getWIBTime(date: Date = new Date()): string {
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date) + ' WIB'
  );
}

export function formatWIBDateTime(date: Date = new Date()): { day: string; dateStr: string; timeStr: string } {
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Hari ini';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';

  return {
    day: weekday,
    dateStr: `${day} ${month} ${year}`,
    timeStr: `${hour}:${minute} WIB`,
  };
}

export function getNowWIB(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

/**
 * Checks whether two dates fall in the exact same month and year in Asia/Jakarta (WIB) timezone
 */
export function isSameMonthWIB(date1: Date | string, date2: Date | string = new Date()): boolean {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

    const f1 = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric' }).format(d1);
    const f2 = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric' }).format(d2);
    return f1 === f2;
  } catch {
    return false;
  }
}

/**
 * Returns month name in Indonesian (e.g., 'Januari', 'Februari') in Asia/Jakarta (WIB)
 */
export function getMonthNameWIB(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'long',
  }).format(date);
}

/**
 * Returns array of the last N months formatted in WIB for bar charts
 */
export function getLastNMonthsWIB(count: number = 6): Array<{ label: string; year: number; month: number }> {
  const result: Array<{ label: string; year: number; month: number }> = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const target = new Date(now);
    target.setMonth(now.getMonth() - i);

    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      month: 'short',
      year: 'numeric',
    }).formatToParts(target);

    const monthName = parts.find((p) => p.type === 'month')?.value || '';
    const yearVal = parseInt(parts.find((p) => p.type === 'year')?.value || `${target.getFullYear()}`, 10);
    const monthNum = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', month: 'numeric' }).format(target),
      10
    );

    result.push({
      label: monthName,
      year: yearVal,
      month: monthNum,
    });
  }

  return result;
}
