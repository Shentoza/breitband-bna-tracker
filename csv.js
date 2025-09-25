import { promises as fs } from "fs";
import { parse } from "csv-parse/sync";

export async function readResultCsv(file) {
    try {
        const content = await fs.readFile(file);
        const result = parse(content, {
            bom: true,
            delimiter: ";",
            columns: true,
            skip_empty_lines: true,
        })[0];
        result['Download (Mbit/s)'] = parseFloat(result['Download (Mbit/s)'].replace(',', '.'));
        result['Upload (Mbit/s)'] = parseFloat(result['Upload (Mbit/s)'].replace(',', '.'));
        result['Laufzeit (ms)'] = parseFloat(result['Laufzeit (ms)'].replace(',', '.'));
        return result;
    } catch (err) {
        console.error("Error reading CSV file:", err);
        return null;
    }
}