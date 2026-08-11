/**
 * Public API of the vehicle feature. Other features (for example `dashboard`) may
 * only depend on symbols re-exported here, plus `features/vehicle/models` and
 * `features/vehicle/ui`, per the dependency rules enforced in `eslint.config.mjs`.
 * Everything else under `features/vehicle/` is internal to the feature.
 */
export { VehicleStore } from './vehicle-store';
export { VehicleForm } from './vehicle-form/vehicle-form';
