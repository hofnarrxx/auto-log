/**
 * Scrolls the page so the top of `element` is at the top of the viewport. Used after paging a
 * list so the user lands at the start of the new page instead of staying at the pager (the
 * bottom of the previous one). Respects `prefers-reduced-motion`.
 */
export function scrollToStartOf(element: HTMLElement | null | undefined): void {
  if (!element || typeof element.scrollIntoView !== 'function') {
    return;
  }

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  element.scrollIntoView({
    block: 'start',
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });
}
