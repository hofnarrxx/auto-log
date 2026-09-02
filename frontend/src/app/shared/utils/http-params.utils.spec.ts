import { buildFuelPageParams, buildMaintenancePageParams } from './http-params.utils';

describe('buildFuelPageParams', () => {
  it('always includes page, size and sort', () => {
    const params = buildFuelPageParams({ page: 2, size: 20, sort: 'newest', gasStation: '' });

    expect(params.get('page')).toBe('2');
    expect(params.get('size')).toBe('20');
    expect(params.get('sort')).toBe('newest');
    expect(params.has('gasStation')).toBe(false);
  });

  it('trims and includes gasStation only when non-empty', () => {
    const params = buildFuelPageParams({
      page: 0,
      size: 20,
      sort: 'newest',
      gasStation: '  Shell  ',
    });

    expect(params.get('gasStation')).toBe('Shell');
  });
});

describe('buildMaintenancePageParams', () => {
  const base = {
    page: 0,
    size: 20,
    sort: 'newest',
    title: '',
    categories: undefined as string[] | undefined,
    currency: '',
    minCost: null as number | null,
    maxCost: null as number | null,
  };

  it('omits categoriesCsv entirely when categories is undefined', () => {
    const params = buildMaintenancePageParams(base);
    expect(params.has('categoriesCsv')).toBe(false);
  });

  it('sends an empty categoriesCsv when categories is an empty array', () => {
    const params = buildMaintenancePageParams({ ...base, categories: [] });
    expect(params.get('categoriesCsv')).toBe('');
  });

  it('joins multiple categories with commas', () => {
    const params = buildMaintenancePageParams({
      ...base,
      categories: ['Oil change', 'Repair'],
    });
    expect(params.get('categoriesCsv')).toBe('Oil change,Repair');
  });

  it('omits currency, minCost and maxCost when unset', () => {
    const params = buildMaintenancePageParams(base);
    expect(params.has('currency')).toBe(false);
    expect(params.has('minCost')).toBe(false);
    expect(params.has('maxCost')).toBe(false);
  });

  it('includes currency, minCost and maxCost when set', () => {
    const params = buildMaintenancePageParams({
      ...base,
      currency: 'EUR',
      minCost: 10,
      maxCost: 200,
    });
    expect(params.get('currency')).toBe('EUR');
    expect(params.get('minCost')).toBe('10');
    expect(params.get('maxCost')).toBe('200');
  });

  it('trims and includes title only when non-empty', () => {
    const params = buildMaintenancePageParams({ ...base, title: '  brake  ' });
    expect(params.get('title')).toBe('brake');
  });
});
