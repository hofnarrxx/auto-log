import { AbstractControl, ValidationErrors } from '@angular/forms';

export const PASSWORD_MIN_LENGTH = 8;

const UPPERCASE_PATTERN = /[A-Z]/;
const SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9]/;

/**
 * Validates that a password contains at least one uppercase letter and one special
 * (non-alphanumeric) character. Length is intentionally left to `Validators.minLength`
 * so its error stays under the standard `minlength` key.
 */
export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) return null;

  const errors: ValidationErrors = {};

  if (!UPPERCASE_PATTERN.test(value)) {
    errors['passwordUppercase'] = true;
  }

  if (!SPECIAL_CHAR_PATTERN.test(value)) {
    errors['passwordSpecialChar'] = true;
  }

  return Object.keys(errors).length ? errors : null;
}
