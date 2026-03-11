import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

function ensureExportsDir() {
  if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

export function generateExcel(data, sheetName = 'Sheet1', filename) {
  ensureExportsDir();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const fname = filename || `export-${Date.now()}.xlsx`;
  const filePath = path.join(EXPORTS_DIR, fname);
  XLSX.writeFile(wb, filePath);
  return { path: filePath, filename: fname };
}

export function readExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const result = {};
  for (const name of wb.SheetNames) {
    result[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
  }
  return result;
}
