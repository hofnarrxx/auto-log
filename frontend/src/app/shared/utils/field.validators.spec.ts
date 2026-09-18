import { FormControl } from '@angular/forms';
import { integerValidator, maxDecimalsValidator, notInFutureValidator } from './field.validators';

describe('integerValidator', () => {
  it('accepts integers and blank values', () => {
    expect(integerValidator(new FormControl(5))).toBeNull();
    expect(integerValidator(new FormControl(0))).toBeNull();
    expect(integerValidator(new FormControl(null))).toBeNull();
    expect(integerValidator(new FormControl(''))).toBeNull();
  });

  it('rejects decimals', () => {
    expect(integerValidator(new FormControl(5.5))).toEqual({ notInteger: true });
  });
});

describe('maxDecimalsValidator', () => {
  const validator = maxDecimalsValidator(2);

  it('accepts values within the allowed decimal places', () => {
    expect(validator(new FormControl(5))).toBeNull();
    expect(validator(new FormControl(5.1))).toBeNull();
    expect(validator(new FormControl(5.12))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('rejects values with too many decimal places', () => {
    expect(validator(new FormControl(5.123))).toEqual({ maxDecimals: { max: 2 } });
  });
});

describe('notInFutureValidator', () => {
  it('accepts blank, past and today values', () => {
    expect(notInFutureValidator(new FormControl(''))).toBeNull();
    expect(notInFutureValidator(new FormControl(null))).toBeNull();
    expect(notInFutureValidator(new FormControl('2000-01-01'))).toBeNull();

    const today = new Date().toISOString().slice(0, 10);
    expect(notInFutureValidator(new FormControl(today))).toBeNull();
  });

  it('rejects future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const value = tomorrow.toISOString().slice(0, 10);

    expect(notInFutureValidator(new FormControl(value))).toEqual({ futureDate: true });
  });
});
