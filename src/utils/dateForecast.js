/**
 * Date/Time Forecast Utility for AERO-SENSE (SIH26078)
 * Computes calendar absolute dates and operational timestamps from the synoptic cycle base.
 * Base Synoptic Cycle: 30 SEP 2026, 00Z run (operational synoptic cycle)
 */

export const BASE_SYNOPTIC_DATE = '2026-09-30T00:00:00Z';
export const OPERATIONAL_TIME_SUFFIX = '~23:40 IST';

/**
 * Returns formatted absolute date for a given lead day offset from the 30 Sep 2026 synoptic cycle.
 * @param {number} dayOffset - Number of days ahead (e.g. 3, 5, 7, 10)
 * @returns {string} e.g. "07 OCT 2026"
 */
export function getForecastDateOnly(dayOffset) {
  const base = new Date(BASE_SYNOPTIC_DATE);
  const target = new Date(base.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const day = String(target.getUTCDate()).padStart(2, '0');
  const month = target.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const year = target.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Returns full lead-time badge with resolved absolute date & time.
 * @param {number} dayOffset - e.g. 7
 * @param {number} [hourOffset] - e.g. 168
 * @param {string} [timeStr] - e.g. "~23:40 IST"
 * @returns {string} e.g. "DAY+7 (168h) · Expected: 07 OCT 2026, ~23:40 IST"
 */
export function formatLeadTimeWithAbsolute(dayOffset, hourOffset = null, timeStr = OPERATIONAL_TIME_SUFFIX) {
  const hours = hourOffset !== null ? hourOffset : dayOffset * 24;
  const dateStr = getForecastDateOnly(dayOffset);
  return `DAY+${dayOffset} (${hours}h) · Expected: ${dateStr}, ${timeStr}`;
}

/**
 * Resolves a relative day window string (e.g. "5–7 Days" or "3–5 Days") into absolute calendar dates.
 * @param {string} windowStr - e.g. "5–7 Days"
 * @param {string} [timeStr] - e.g. "~23:40 IST"
 * @returns {string} e.g. "5–7 Days (05 OCT – 07 OCT 2026, ~23:40 IST)"
 */
export function formatForecastWindowWithAbsolute(windowStr, timeStr = OPERATIONAL_TIME_SUFFIX) {
  if (!windowStr) return '';
  // Match numbers like "5–7" or "5-7" or "5 to 7"
  const match = windowStr.match(/(\d+)\s*[-–—to]+\s*(\d+)/i);
  if (match) {
    const startDay = parseInt(match[1], 10);
    const endDay = parseInt(match[2], 10);
    const startDate = getForecastDateOnly(startDay);
    const endDate = getForecastDateOnly(endDay);
    return `${windowStr} · Expected: ${startDate} – ${endDate}, ${timeStr}`;
  }
  const singleMatch = windowStr.match(/(\d+)/);
  if (singleMatch) {
    const day = parseInt(singleMatch[1], 10);
    return `${windowStr} · Expected: ${getForecastDateOnly(day)}, ${timeStr}`;
  }
  return windowStr;
}

/**
 * Returns a compact range label suitable for table headers or cards
 * e.g. "05–07 OCT 2026"
 */
export function getCompactDateRange(startDay, endDay) {
  const base = new Date(BASE_SYNOPTIC_DATE);
  const t1 = new Date(base.getTime() + startDay * 24 * 60 * 60 * 1000);
  const t2 = new Date(base.getTime() + endDay * 24 * 60 * 60 * 1000);
  const d1 = String(t1.getUTCDate()).padStart(2, '0');
  const d2 = String(t2.getUTCDate()).padStart(2, '0');
  const m2 = t2.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const y2 = t2.getUTCFullYear();
  return `${d1}–${d2} ${m2} ${y2}`;
}
