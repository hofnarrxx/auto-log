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

/**
 * Group-level validator that compares a `password` and `confirmPassword` control and
 * surfaces a `passwordMismatch` error on the `confirmPassword` control, matching the
 * convention used for the other field-level errors on this form.
 */
export function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password');
  const confirmPassword = group.get('confirmPassword');
  if (!password || !confirmPassword) return null;

  if (confirmPassword.value && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
  } else if (confirmPassword.errors) {
    const remaining = { ...confirmPassword.errors };
    delete remaining['passwordMismatch'];
    confirmPassword.setErrors(Object.keys(remaining).length ? remaining : null);
  }

  return null;
}
