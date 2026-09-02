export type MaintenanceSortOption = 'newest' | 'oldest' | 'price-low-high' | 'price-high-low';

export interface MaintenanceListRecord {
  id: number;
  serviceDate: string;
  title?: string | null;
  mileage: number | null;
  category: string;
  cost: number | null;
  currency?: string;
}

export function getMaintenanceCategoryLabel(category: string): string {
  switch (category.trim().toLowerCase()) {
    case 'inspection':
      return 'vehicle.maintenanceTab.categories.inspection';
    case 'oil change':
      return 'vehicle.maintenanceTab.categories.oilChange';
    case 'repair':
      return 'vehicle.maintenanceTab.categories.repair';
    case 'part replacement':
      return 'vehicle.maintenanceTab.categories.partReplacement';
    case 'fluid refill':
      return 'vehicle.maintenanceTab.categories.fluidRefill';
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
    inspection: 'search',
    'oil change': 'droplet',
    repair: 'wrench',
    'part replacement': 'cog',
    'fluid refill': 'droplets',
    'tires & wheels': 'disc',
    cosmetic: 'sparkles',
  };

  return iconMap[normalizedCategory] ?? 'tool-case';
}
