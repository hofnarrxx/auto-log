import {
  toCreateVehicleCommand,
  toUpdateVehicleCommand,
  type VehicleFormValue,
} from './vehicle-form.mapper';

const completeValue: VehicleFormValue = {
  brand: 'Volvo',
  model: 'V60',
  year: 2019,
  mileage: 120_000,
  fuelType: 'Diesel',
  licensePlate: 'ABC 1234',
};

describe('vehicle form mapping', () => {
  describe('toCreateVehicleCommand', () => {
    it('maps a complete form value together with the image key', () => {
      expect(toCreateVehicleCommand(completeValue, 'vehicles/1/image.jpg')).toEqual({
        brand: 'Volvo',
        model: 'V60',
        year: 2019,
        mileage: 120_000,
        fuelType: 'Diesel',
        licensePlate: 'ABC 1234',
        imageKey: 'vehicles/1/image.jpg',
      });
    });

    it('keeps an optional licence plate and a missing image as null', () => {
      const command = toCreateVehicleCommand({ ...completeValue, licensePlate: null }, null);

      expect(command?.licensePlate).toBeNull();
      expect(command?.imageKey).toBeNull();
    });

    it('refuses to build a payload while a required field is empty', () => {
      expect(toCreateVehicleCommand({ ...completeValue, year: null }, null)).toBeNull();
      expect(toCreateVehicleCommand({ ...completeValue, mileage: null }, null)).toBeNull();
      expect(toCreateVehicleCommand({ ...completeValue, fuelType: null }, null)).toBeNull();
      expect(toCreateVehicleCommand({ ...completeValue, fuelType: '' }, null)).toBeNull();
    });

    it('accepts zero mileage', () => {
      expect(toCreateVehicleCommand({ ...completeValue, mileage: 0 }, null)?.mileage).toBe(0);
    });
  });

  describe('toUpdateVehicleCommand', () => {
    it('adds the vehicle id to the mapped fields', () => {
      expect(toUpdateVehicleCommand(7, completeValue, null)).toEqual({
        id: 7,
        brand: 'Volvo',
        model: 'V60',
        year: 2019,
        mileage: 120_000,
        fuelType: 'Diesel',
        licensePlate: 'ABC 1234',
        imageKey: null,
      });
    });

    it('returns null when the form value is incomplete', () => {
      expect(toUpdateVehicleCommand(7, { ...completeValue, year: null }, null)).toBeNull();
    });
  });
});
