import { HttpParams } from '@angular/common/http';

/**
 * Structural (not imported) shape of `FuelQuery` — kept duck-typed so this file can stay under
 * `shared/` without depending on `features/vehicle/models`.
 */
export interface FuelPageParams {
  page: number;
  size: number;
  sort: string;
  gasStation: string;
}

/**
 * Builds the query string for a paged fuel list request. Empty/omittable filters are left out
 * entirely rather than sent as blank params.
 */
export function buildFuelPageParams(query: FuelPageParams): HttpParams {
  let params = new HttpParams()
    .set('page', query.page)
    .set('size', query.size)
    .set('sort', query.sort);

  const gasStation = query.gasStation.trim();
  if (gasStation) {
    params = params.set('gasStation', gasStation);
  }

  return params;
}

/**
 * Structural (not imported) shape of `MaintenanceQuery` — see `FuelPageParams` for why.
 * `categories === undefined` means "no filter" (the `categoriesCsv` param is omitted); an empty
 * array is sent as `categoriesCsv=` to explicitly match zero records, matching
 * `MaintenanceController`'s handling of the param.
 */
export interface MaintenancePageParams {
  page: number;
  size: number;
  sort: string;
  title: string;
  categories: string[] | undefined;
  currency: string;
  minCost: number | null;
  maxCost: number | null;
}

/**
 * Builds the query string for a paged maintenance list request. Empty/omittable filters are
 * left out entirely rather than sent as blank params.
 */
export function buildMaintenancePageParams(query: MaintenancePageParams): HttpParams {
  let params = new HttpParams()
    .set('page', query.page)
    .set('size', query.size)
    .set('sort', query.sort);

  const title = query.title.trim();
  if (title) {
    params = params.set('title', title);
  }

  if (query.categories !== undefined) {
    params = params.set('categoriesCsv', query.categories.join(','));
  }

  if (query.currency) {
    params = params.set('currency', query.currency);
  }

  if (query.minCost !== null) {
    params = params.set('minCost', query.minCost);
  }

  if (query.maxCost !== null) {
    params = params.set('maxCost', query.maxCost);
  }

  return params;
}
