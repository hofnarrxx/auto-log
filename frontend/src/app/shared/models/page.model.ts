/**
 * Mirrors the backend's `PageResponse<T>` envelope returned by every paged list endpoint.
 * `page` is 0-based, matching Spring Data's `Page.getNumber()`.
 */
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Empty page shell for a given page/size, used as a safe fallback when a paged request fails.
 */
export function emptyPage<T>(page: number, size: number): Page<T> {
  return { items: [], page, size, totalElements: 0, totalPages: 0 };
}
