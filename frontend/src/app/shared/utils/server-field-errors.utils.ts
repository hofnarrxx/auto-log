import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

/** Shape of a `VALIDATION_FAILED` body returned by `GlobalExceptionHandler`. */
interface ValidationFailedBody {
  error?: string;
  fields?: Record<string, string>;
}

/**
 * Applies server-side field errors (from a `VALIDATION_FAILED` 400 response) to the matching
 * controls of `form`, so a rule the backend enforces but the client missed still surfaces inline
 * instead of only as a generic toast. Field names in the response are expected to line up with
 * the form's control names.
 *
 * Returns `true` if at least one control was matched and marked invalid, so callers can decide
 * whether a fallback toast is still needed.
 */
export function applyServerFieldErrors(form: FormGroup, error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 400) {
    return false;
  }

  const body = error.error as ValidationFailedBody | null;
  if (!body || body.error !== 'VALIDATION_FAILED' || !body.fields) {
    return false;
  }

  let matched = false;

  for (const field of Object.keys(body.fields)) {
    const control = form.get(field);
    if (!control) {
      continue;
    }

    control.setErrors({ ...control.errors, server: true });
    control.markAsTouched();
    matched = true;
  }

  return matched;
}
