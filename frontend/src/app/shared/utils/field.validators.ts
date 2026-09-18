import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mirrors `@Max(10_000_000)` on `mileage` across the vehicle, fuel and maintenance DTOs. */
export const MAX_MILEAGE = 10_000_000;

/** Mirrors `@Digits(integer = 10, fraction = 2)` on `cost` across the fuel and maintenance DTOs. */
export const MAX_COST = 9_999_999_999.99;

/** Mirrors `@Digits(integer = 9, fraction = 3)` on `FuelRequest.amount`. */
export const MAX_FUEL_AMOUNT = 999_999_999.999;

/**
 * Rejects non-integer numbers, matching the backend's use of an `Integer` field for mileage.
 * Blank/null values are left to `Validators.required`.
 */
export function integerValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(value) ? null : { notInteger: true };
}

/**
 * Rejects numbers with more than `max` decimal places, matching the backend's `@Digits(fraction =
 * ...)` constraints on monetary/amount fields. Blank/null values are left to
 * `Validators.required`.
 */
export function maxDecimalsValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;

    const asString = String(value);
    const decimalPart = asString.split('.')[1];
    return !decimalPart || decimalPart.length <= max ? null : { maxDecimals: { max } };
  };
}

/**
 * Rejects dates after today, matching `RequestValidation.requireNotFuture` on the backend. Blank
 * values are left to `Validators.required`.
 */
export function notInFutureValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed.getTime() > today.getTime() ? { futureDate: true } : null;
}
