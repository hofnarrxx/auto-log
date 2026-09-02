# Auto Log frontend

Angular 21 standalone application for the Auto Log vehicle log.

## Setup

Install the locked dependency tree:

```bash
npm ci
```

Start the development server:

```bash
npm start
```

Open `http://localhost:4200`. Development and production environment files currently point to an API at `http://localhost:8080`.

## Commands

- `npm start` — start the development server.
- `npm run build` — create the default production build.
- `npm run build:prod` — create an explicit production build.
- `npm test` — run Karma in watch mode.
- `npm run test:ci` — run headless tests once and generate coverage.
- `npm run typecheck` — run Angular and TypeScript compilation without emitting files.
- `npm run lint` — lint TypeScript and Angular templates.
- `npm run format` — format supported project files.
- `npm run format:check` — check formatting without modifying files.
- `npm run i18n:check` — verify that English and Polish translation keys match.

There is no end-to-end test runner configured yet.

## Source structure

```text
src/app/
  core/       App-wide infrastructure: authentication, configuration, layout
  features/   Route-level product features, each with a *.routes.ts entry point
  shared/     Reusable UI, pipes, services, and pure utilities
```

Path aliases `@core/*`, `@shared/*`, `@features/*` (configured in `tsconfig.json`) point at
`src/app/core/*`, `src/app/shared/*`, and `src/app/features/*`. Prefer them for new code that
crosses one of those layers; same-feature relative imports stay relative.

Current dependency rules, enforced by `eslint.config.mjs` where practical:

- Feature code may depend on `core` and `shared`. `core` and `shared` must not import feature
  internals.
- A feature must not import another feature's internal component, store, or API service. The
  exceptions are `features/vehicle/models/**` (shared record contracts) and
  `features/vehicle/ui/**` (domain-specific reusable UI, consumed as-is by `features/share`), plus
  a feature's own `index.ts` barrel where one exists (see `features/vehicle/index.ts`) as its
  declared public API.
- Components should delegate HTTP transport to focused `*-api.ts` services.
- Stores (`*-store.ts`) own server-backed feature state; pure calculations belong in `*.utils.ts`.
  There is no separate facade layer.
- Generic UI belongs in `shared/ui`; vehicle-specific reusable UI remains in the vehicle feature.
- Top-level pages are lazy-loaded through a `*.routes.ts` file colocated with the feature.
- Tests are colocated with source as `*.spec.ts`.

## Server-side pagination for fuel and maintenance records

Fuel and maintenance records are paginated server-side; the frontend never holds a full record
set in memory. This shapes a few areas of the vehicle feature:

- `FuelStore`/`MaintenanceStore` (`features/vehicle/*-store.ts`) each hold a `query` signal
  (sort/filter/page/size), the current `Page<T>` (`records`, `page`, `size`, `totalElements`,
  `totalPages`), and a separate `summary` signal for aggregates (totals, mileage warnings, latest
  odometer, average consumption) computed server-side over the _whole_ record set, not just the
  current page. `setQuery`/`setPage`/`setSize` feed a `Subject` through `switchMap`, so a stale
  in-flight request can never overwrite a newer one.
- `FuelList`/`MaintenanceList` (`features/vehicle/ui/*-list`) are controlled components: they
  receive records, query state, summary-derived fields (totals, mileage-warning ids) and pager
  state as `@Input()`s, and only report intent via `queryChange`/`pageChange`/`sizeChange`
  outputs. They own no server data themselves, which lets `features/share` reuse them against a
  different backend endpoint (public share tokens instead of authenticated vehicle ids).
- `shared/models/page.model.ts` defines the generic `Page<T>` shape returned by every paged
  endpoint. `shared/utils/http-params.utils.ts` builds the corresponding `HttpParams` for fuel and
  maintenance queries. `shared/ui/pagination` is the generic pager UI (Prev/Next, numbered
  buttons with ellipsis via `shared/utils/pagination.utils.ts`, page-size select).
- The public share flow (`features/share`) mirrors this: `PublicShareApi` exposes paged
  `getFuelPage`/`getMaintenancePage` by token, and `SharedVehicleFuelTab`/
  `SharedVehicleMaintenanceTab` keep their own lightweight query/page state (no store, since
  there is nothing to save/delete). There is no public categories-metadata endpoint, so the
  maintenance filter modal never offers a category filter there (`MaintenanceList` treats an
  empty `availableCategories` as "don't filter by category" rather than "match nothing").

## Internationalization

Runtime translations live in:

- `public/i18n/en.json`
- `public/i18n/pl.json`

When adding a key, update both files and run `npm run i18n:check`.

## Quality workflow

Before opening a pull request, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run i18n:check
npm run test:ci
npm run build:prod
```

Build artifacts, Angular cache files, coverage, and dependencies are ignored by `frontend/.gitignore`.
