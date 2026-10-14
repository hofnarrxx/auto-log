/**
 * SEO settings a route can declare under `data: { seo: ... }`.
 *
 * Routes without this data are treated as private: they get `noindex, nofollow`
 * and no canonical URL. Only public, content-bearing pages should opt in.
 */
export interface RouteSeo {
  /** Allow search engines to index the page. Defaults to false. */
  indexable?: boolean;
  /** Canonical path (e.g. `/privacy`). Only used when the route is indexable. */
  canonicalPath?: string;
  /** Translation key for the meta description. Falls back to the site-wide description. */
  descriptionKey?: string;
  /** Send no Referer header from this page (e.g. pages whose URL contains a secret token). */
  noReferrer?: boolean;
}

export const DEFAULT_DESCRIPTION_KEY = 'seo.defaultDescription';
export const DEFAULT_TITLE_KEY = 'seo.defaultTitle';
