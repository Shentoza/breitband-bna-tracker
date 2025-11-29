import { describe, it, expect } from 'vitest';
import { parseCsvContent, RawCsvRow } from '../src/csv';

describe('readResultCsv', () => {
  it('parses embedded example CSV (anonymized) into numbers and a sensible date', async () => {

    // build a typed RawCsvRow (we assume this type exists in the codebase)
    const row: RawCsvRow = {
      'Messzeitpunkt': '21.09.2025',
      'Download (Mbit/s)': '249,06',
      'Upload (Mbit/s)': '50,16',
      'Laufzeit (ms)': '7',
      'Test-ID': 'affeaffeaffeaffeaffeaffeaffeaffeaffeaffeaffeaffeaffeaffeaffeaffe',
      'Version': '4.56',
      'Betriebssystem': 'Windows',
      'Internet-Browser': 'Chrome 140.0.0.0',
      'Uhrzeit': '13:07:31',
    };

    const parsed = await parseCsvContent(row);
    expect(parsed).not.toBeNull();
    if (!parsed) return;

    // numeric fields
    expect(Number.isFinite(parsed['Download (Mbit/s)'])).toBe(true);
    expect(parsed['Download (Mbit/s)']).toBeCloseTo(249.06, 2);
    expect(Number.isFinite(parsed['Upload (Mbit/s)'])).toBe(true);
    expect(parsed['Upload (Mbit/s)']).toBeCloseTo(50.16, 2);
    expect(Number.isFinite(parsed['Laufzeit (ms)'])).toBe(true);
    expect(parsed['Laufzeit (ms)']).toBeCloseTo(7, 0);

    // parsedDateTime exists and matches expected components (21.09.2025 13:07:31)
    const dt = parsed.parsedDateTime;
    expect(dt).toBeInstanceOf(Date);
    expect(dt.getFullYear()).toBe(2025);
    expect(dt.getMonth()).toBe(8); // September -> month index 8
    expect(dt.getDate()).toBe(21);
    expect(dt.getHours()).toBe(13);
    expect(dt.getMinutes()).toBe(7);
    expect(dt.getSeconds()).toBe(31);
  });
});
