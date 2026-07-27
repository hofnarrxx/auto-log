/**
 * Converts an `YYYY-MM-DD` date string into a local-midnight timestamp.
 * Unparseable values collapse to `0` so they sort as the oldest entries.
 */
export function toDateTimestamp(date: string | null | undefined): number {
  if (!date) {
    return 0;
  }

  const timestamp = new Date(`${date}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
