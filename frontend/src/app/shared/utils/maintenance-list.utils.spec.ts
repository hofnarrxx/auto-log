import {
  getMaintenanceCategoryIcon,
  getMaintenanceCategoryLabel,
  getMaintenanceTimelineEntries,
  MaintenanceFilterState,
  MaintenanceListRecord,
} from './maintenance-list.utils';

const records: MaintenanceListRecord[] = [
  {
    id: 1,
    serviceDate: '2026-01-10',
    title: 'Oil and filters',
    mileage: 20_000,
    category: 'Oil change',
    cost: 200,
    currency: 'PLN',
  },
  {
    id: 2,
    serviceDate: '2026-02-10',
    title: 'Annual inspection',
    mileage: 21_000,
    category: 'Inspection',
    cost: 100,
    currency: 'PLN',
  },
  {
    id: 3,
    serviceDate: '2026-03-10',
    title: 'Emergency repair',
    mileage: 20_900,
    category: 'Repair',
    cost: 300,
    currency: 'EUR',
  },
];

const defaultFilters: MaintenanceFilterState = {
  selectedCategories: ['Oil change', 'Inspection', 'Repair'],
  selectedCurrencyFilter: 'All',
  minPriceLimit: 0,
  maxPriceLimit: 1_000,
  selectedSort: 'newest',
  titleSearch: '',
};

const getCurrency = (record: MaintenanceListRecord) => record.currency ?? '';

describe('maintenance-list utilities', () => {
  it('maps known category labels and icons and preserves unknown labels', () => {
    expect(getMaintenanceCategoryLabel(' Oil Change ')).toBe(
      'vehicle.maintenanceTab.categories.oilChange'
    );
    expect(getMaintenanceCategoryIcon('Oil change')).toBe('droplet');
    expect(getMaintenanceCategoryLabel('Custom work')).toBe('Custom work');
    expect(getMaintenanceCategoryIcon('Custom work')).toBe('tool-case');
  });

  it('filters by category, currency, price, and title', () => {
    const result = getMaintenanceTimelineEntries(
      records,
      {
        ...defaultFilters,
        selectedCategories: ['Inspection'],
        selectedCurrencyFilter: 'PLN',
        minPriceLimit: 50,
        maxPriceLimit: 150,
        titleSearch: 'annual',
      },
      getCurrency
    );

    expect(result).toEqual([records[1]]);
  });

  it('sorts matching records by ascending price', () => {
    const result = getMaintenanceTimelineEntries(
      records,
      { ...defaultFilters, selectedSort: 'price-low-high' },
      getCurrency
    );

    expect(result.map((record) => record.id)).toEqual([2, 1, 3]);
  });

  it('excludes all records when no categories are selected', () => {
    const result = getMaintenanceTimelineEntries(
      records,
      { ...defaultFilters, selectedCategories: [] },
      getCurrency
    );

    expect(result).toEqual([]);
  });

  it('keeps records without a cost only when every currency is allowed', () => {
    const withoutCost = records.map((record) => ({ ...record, cost: null }));

    expect(
      getMaintenanceTimelineEntries(withoutCost, defaultFilters, getCurrency).map(
        (record) => record.id
      )
    ).toEqual([3, 2, 1]);
    expect(
      getMaintenanceTimelineEntries(
        withoutCost,
        { ...defaultFilters, selectedCurrencyFilter: 'PLN' },
        getCurrency
      )
    ).toEqual([]);
  });
});
