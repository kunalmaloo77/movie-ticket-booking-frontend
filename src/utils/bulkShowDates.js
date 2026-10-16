function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatYYYYMMDD(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseYYYYMMDD(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: formatYYYYMMDD(start), endDate: formatYYYYMMDD(end) };
}

export function generateDatesInRange(startDate, endDate, includedWeekdays) {
  if (!startDate || !endDate) return [];

  const start = parseYYYYMMDD(startDate);
  const end = parseYYYYMMDD(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (includedWeekdays?.[cursor.getDay()]) {
      dates.push(formatYYYYMMDD(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function combineDateAndTimeSlots(dates, timeSlots) {
  const combined = new Set();
  dates.forEach((date) => {
    timeSlots.forEach((time) => {
      if (time) combined.add(`${date}T${time}`);
    });
  });
  return [...combined].sort();
}
