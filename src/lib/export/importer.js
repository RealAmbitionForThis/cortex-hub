import { readExcel } from './excel';
import { parseCSV } from './csv';

export async function importFile(buffer, filename) {
  const ext = filename.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const text = buffer.toString('utf-8');
    const data = parseCSV(text);
    return { sheets: { Sheet1: data }, format: 'csv' };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const sheets = readExcel(buffer);
    return { sheets, format: 'excel' };
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
