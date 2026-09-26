export type MaintenanceSortOption = 'newest' | 'oldest' | 'price-low-high' | 'price-high-low';

export interface MaintenanceListRecord {
  id: string;
  serviceDate: string;
  title?: string | null;
  mileage: number | null;
  category: string;
  cost: number | null;
  currency?: string;
}

export function getMaintenanceCategoryLabel(category: string): string {
  switch (category.trim().toLowerCase()) {
    case 'inspection & diagnostics':
      return 'vehicle.maintenanceTab.categories.inspectionAndDiagnostics';
    case 'oil & filters':
      return 'vehicle.maintenanceTab.categories.oilAndFilters';
    case 'repair':
      return 'vehicle.maintenanceTab.categories.repair';
    case 'part replacement':
      return 'vehicle.maintenanceTab.categories.partReplacement';
    case 'fluids':
      return 'vehicle.maintenanceTab.categories.fluids';
    case 'tires & wheels':
      return 'vehicle.maintenanceTab.categories.tiresAndWheels';
    case 'cosmetic':
      return 'vehicle.maintenanceTab.categories.cosmetic';
    default:
      return category;
  }
}

export function getMaintenanceCategoryIcon(category: string): string {
  const normalizedCategory = category.trim().toLowerCase();
  const iconMap: Record<string, string> = {
    'inspection & diagnostics': 'search',
    'oil & filters': 'droplet',
    repair: 'wrench',
    'part replacement': 'cog',
    fluids: 'droplets',
    'tires & wheels': 'disc',
    cosmetic: 'sparkles',
  };

  return iconMap[normalizedCategory] ?? 'tool-case';
}
