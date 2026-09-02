export type PageNumberEntry = number | 'ellipsis';

/**
 * Builds a compact, 0-based window of page numbers to render as pager buttons, always keeping
 * the first and last page visible and collapsing the middle into an `'ellipsis'` marker once
 * there are more pages than `maxButtons` can show.
 */
export function buildPageNumbers(
  page: number,
  totalPages: number,
  maxButtons = 7
): PageNumberEntry[] {
  if (totalPages <= 0) {
    return [];
  }

  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const siblingCount = Math.max(1, Math.floor((maxButtons - 4) / 2));
  const first = 0;
  const last = totalPages - 1;
  const rangeStart = Math.max(first + 1, page - siblingCount);
  const rangeEnd = Math.min(last - 1, page + siblingCount);

  const entries: PageNumberEntry[] = [first];

  if (rangeStart > first + 1) {
    entries.push('ellipsis');
  }

  for (let current = rangeStart; current <= rangeEnd; current++) {
    entries.push(current);
  }

  if (rangeEnd < last - 1) {
    entries.push('ellipsis');
  }

  entries.push(last);

  return entries;
}
