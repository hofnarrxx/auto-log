import { parseIntegerField, parseNumericField } from './form-value.utils';

describe('numeric form field parsing', () => {
  describe('parseNumericField', () => {
    it('reports numbers, including zero and negatives', () => {
      expect(parseNumericField(12.5)).toEqual({ kind: 'number', value: 12.5 });
      expect(parseNumericField(0)).toEqual({ kind: 'number', value: 0 });
      expect(parseNumericField(-3)).toEqual({ kind: 'number', value: -3 });
    });

    it('reports an empty control as blank rather than zero', () => {
      expect(parseNumericField('')).toEqual({ kind: 'blank' });
      expect(parseNumericField(null)).toEqual({ kind: 'blank' });
      expect(parseNumericField(undefined)).toEqual({ kind: 'blank' });
    });

    it('distinguishes unusable values from blank ones', () => {
      expect(parseNumericField('abc')).toEqual({ kind: 'invalid' });
      expect(parseNumericField(Number.NaN)).toEqual({ kind: 'invalid' });
      expect(parseNumericField(Number.POSITIVE_INFINITY)).toEqual({ kind: 'invalid' });
    });

    it('accepts numeric strings', () => {
      expect(parseNumericField('42.5')).toEqual({ kind: 'number', value: 42.5 });
    });
  });

  describe('parseIntegerField', () => {
    it('truncates towards zero', () => {
      expect(parseIntegerField(12.9)).toEqual({ kind: 'number', value: 12 });
      expect(parseIntegerField(-12.9)).toEqual({ kind: 'number', value: -12 });
    });

    it('passes blank and invalid values through unchanged', () => {
      expect(parseIntegerField('')).toEqual({ kind: 'blank' });
      expect(parseIntegerField('abc')).toEqual({ kind: 'invalid' });
    });
  });
});
