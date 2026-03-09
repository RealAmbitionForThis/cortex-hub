import path from 'path';
import fs from 'fs';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

function ensureExportsDir() {
  if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

export function generateCSV(data, filename) {
  ensureExportsDir();
  if (!data.length) return { path: '', filename: '' };

  const headers = Object.keys(data[0]);
  const rows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h] ?? '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    });
    rows.push(values.join(','));
  }

  const fname = filename || `export-${Date.now()}.csv`;
  const filePath = path.join(EXPORTS_DIR, fname);
  fs.writeFileSync(filePath, rows.join('\n'), 'utf-8');
  return { path: filePath, filename: fname };
}

export function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
