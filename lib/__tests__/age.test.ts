import { ageFromBirthDate } from '@/lib/age';

describe('ageFromBirthDate', () => {
  it('returns 0 for invalid date', () => {
    expect(ageFromBirthDate('not-a-date')).toBe(0);
  });

  it('computes age for a known date', () => {
    const fixed = new Date('2026-06-15T12:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixed);
    expect(ageFromBirthDate('2000-01-01')).toBe(26);
    jest.useRealTimers();
  });
});
