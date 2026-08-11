export type VehicleTab = 'details' | 'maintenance' | 'fuel';

/**
 * Maps the `tab` query parameter to a known vehicle tab, defaulting to `details` for
 * missing or unrecognized values. Shared by the vehicle route shell (tab navigation)
 * and the vehicle dashboard (tab content) so both derive the same tab from one place.
 */
export function parseVehicleTab(value: string | null): VehicleTab {
  if (value === 'maintenance') {
    return 'maintenance';
  }

  if (value === 'fuel') {
    return 'fuel';
  }

  return 'details';
}
