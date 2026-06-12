const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatLongDate(d: Date) {
  return `${WEEKDAY[d.getDay()]}, ${MONTH_LONG[d.getMonth()]} ${d.getDate()}`;
}

export function formatShortDate(d: Date) {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function formatNumericDate(d: Date) {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatWeight(kg: number) {
  return kg.toFixed(1);
}

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
