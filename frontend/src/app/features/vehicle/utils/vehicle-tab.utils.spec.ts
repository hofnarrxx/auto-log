import { parseVehicleTab } from './vehicle-tab.utils';

describe('parseVehicleTab', () => {
  it('returns maintenance for the maintenance value', () => {
    expect(parseVehicleTab('maintenance')).toBe('maintenance');
  });

  it('returns fuel for the fuel value', () => {
    expect(parseVehicleTab('fuel')).toBe('fuel');
  });

  it('defaults to details for null', () => {
    expect(parseVehicleTab(null)).toBe('details');
  });

  it('defaults to details for an unrecognized value', () => {
    expect(parseVehicleTab('unknown')).toBe('details');
  });
});
