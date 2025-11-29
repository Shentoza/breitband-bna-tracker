import fs from "fs/promises";
import { parse } from "csv-parse/sync";

// Raw CSV row as returned by csv-parse (values are strings)
export type RawCsvRow = Record<string, string>;

export type ParsedResult = {
  "Download (Mbit/s)": number;
  "Upload (Mbit/s)": number;
  "Laufzeit (ms)": number;
  "Test-ID": string;
  Version: string;
  Betriebssystem: string;
  Browser: string;
  Messzeitpunkt: string;
  Uhrzeit: string;
  parsedDateTime: Date;
};

function parseGermanNumber(v?: string | number): number {
  if (v === undefined || v === null) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function parseGermanDateTime(dateStr?: string, timeStr?: string): Date {
  if (!dateStr || !timeStr) {
    console.warn("Missing date or time for parsing German date/time:", {
      dateStr,
      timeStr,
    });
    return new Date();
  }
  const isoDate = dateStr.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})/, "$3-$2-$1");

  return new Date(`${isoDate}T${timeStr}`);
}

async function readFileContent(file: string): Promise<RawCsvRow> {
  const content = await fs.readFile(file);
  const parsedRows = parse(content, {
    bom: true,
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
  }) as RawCsvRow[];
  const result = parsedRows?.[0];
  if (!result) {
    throw new Error("No rows parsed from CSV");
  }
  return result;
}

export async function getResultFromFile(
  file: string
): Promise<ParsedResult | null> {
  try {
    const rawRow = await readFileContent(file);

    return parseCsvContent(rawRow);
  } catch (err) {
    console.error("Error reading CSV file:", err);
    return null;
  }
}

export async function parseCsvContent(
  rawCSV: RawCsvRow
): Promise<ParsedResult | null> {
  const parsed: ParsedResult = {
    "Download (Mbit/s)": parseGermanNumber(rawCSV["Download (Mbit/s)"]),
    "Upload (Mbit/s)": parseGermanNumber(rawCSV["Upload (Mbit/s)"]),
    "Laufzeit (ms)": parseGermanNumber(rawCSV["Laufzeit (ms)"]),
    "Test-ID": rawCSV["Test-ID"],
    Version: rawCSV["Version"],
    Betriebssystem: rawCSV["Betriebssystem"],
    Browser: rawCSV["Internet-Browser"],
    Messzeitpunkt: rawCSV["Messzeitpunkt"],
    Uhrzeit: rawCSV["Uhrzeit"],
    parsedDateTime: parseGermanDateTime(
      rawCSV["Messzeitpunkt"],
      rawCSV["Uhrzeit"]
    ),
  };
  return parsed;
}
