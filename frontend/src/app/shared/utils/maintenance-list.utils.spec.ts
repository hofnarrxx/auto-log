import { getMaintenanceCategoryIcon, getMaintenanceCategoryLabel } from './maintenance-list.utils';

describe('maintenance-list utilities', () => {
  it('maps known category labels and icons and preserves unknown labels', () => {
    expect(getMaintenanceCategoryLabel(' Oil & Filters ')).toBe(
      'vehicle.maintenanceTab.categories.oilAndFilters'
    );
    expect(getMaintenanceCategoryIcon('Oil & filters')).toBe('droplet');
    expect(getMaintenanceCategoryLabel('Custom work')).toBe('Custom work');
    expect(getMaintenanceCategoryIcon('Custom work')).toBe('tool-case');
  });

  it('maps every known category to a distinct icon', () => {
    expect(getMaintenanceCategoryIcon('Inspection & diagnostics')).toBe('search');
    expect(getMaintenanceCategoryIcon('Repair')).toBe('wrench');
    expect(getMaintenanceCategoryIcon('Part Replacement')).toBe('cog');
    expect(getMaintenanceCategoryIcon('Fluids')).toBe('droplets');
    expect(getMaintenanceCategoryIcon('Tires & Wheels')).toBe('disc');
    expect(getMaintenanceCategoryIcon('Cosmetic')).toBe('sparkles');
  });
});
