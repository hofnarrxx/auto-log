/**
 * A numeric form control can hold a number, be left empty, or — when a template binds a raw
 * string — hold something that is not a number at all. Callers usually treat the last two cases
 * differently, so parsing keeps them apart instead of collapsing both to `null`.
 */
export type NumericField =
  | { readonly kind: 'blank' }
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'invalid' };

const BLANK: NumericField = { kind: 'blank' };
const INVALID: NumericField = { kind: 'invalid' };

export function parseNumericField(value: number | string | null | undefined): NumericField {
  if (value === null || value === undefined || value === '') {
    return BLANK;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? { kind: 'number', value: parsed } : INVALID;
}

export function parseIntegerField(value: number | string | null | undefined): NumericField {
  const parsed = parseNumericField(value);
  return parsed.kind === 'number' ? { kind: 'number', value: Math.trunc(parsed.value) } : parsed;
}
