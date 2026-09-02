export type {
  MaintenanceAttachment,
  MaintenanceAttachmentDownloadUrlResponse,
  MaintenanceAttachmentUploadUrlResponse,
  MaintenanceRecord,
  MaintenanceRecordPayload,
} from './maintenance-record.model';

export type { FuelRecord, FuelRecordPayload } from './fuel-record.model';
export type { CreateShareLinkRequest, ShareLinkResponse } from './share-link.model';
export type {
  CreateVehicleCommand,
  UpdateVehicleCommand,
  Vehicle,
  VehicleImageUploadUrlResponse,
} from './vehicle.model';
export type { LatestOdometer } from './latest-odometer.model';
export type { FuelSummary } from './fuel-summary.model';
export type { MaintenanceSummary } from './maintenance-summary.model';
export type { FuelQuery, FuelSortOption } from './fuel-query.model';
export { DEFAULT_FUEL_PAGE_SIZE, DEFAULT_FUEL_QUERY } from './fuel-query.model';
export type { MaintenanceQuery, MaintenanceSortOption } from './maintenance-query.model';
export {
  ALL_CURRENCIES,
  DEFAULT_MAINTENANCE_PAGE_SIZE,
  DEFAULT_MAINTENANCE_QUERY,
} from './maintenance-query.model';
