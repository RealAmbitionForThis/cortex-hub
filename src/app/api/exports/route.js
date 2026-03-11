import { NextResponse } from 'next/server';
import { success, badRequest, notFound, withHandler } from '@/lib/api/response';
import { generateExcel } from '@/lib/export/excel';
import { generateCSV } from '@/lib/export/csv';
import { logExport, getExportHistory, getModuleData } from '@/lib/tools/export/queries';
import fs from 'fs';
import path from 'path';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const download = searchParams.get('download');

  if (download) {
    const sanitized = path.basename(download);
    if (!/^[\w.\-]+$/.test(sanitized)) {
      return badRequest('Invalid filename');
    }
    const filePath = path.join(EXPORTS_DIR, sanitized);
    if (!filePath.startsWith(EXPORTS_DIR) || !fs.existsSync(filePath)) {
      return notFound('File not found');
    }
    const buffer = fs.readFileSync(filePath);
    const ext = sanitized.split('.').pop();
    const contentType = ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return new NextResponse(buffer, { headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${sanitized}"` } });
  }

  return success({ exports: getExportHistory() });
});

export const POST = withHandler(async (request) => {
  const { module: mod, format = 'xlsx', filename } = await request.json();
  const ALLOWED_MODULES = ['transactions', 'tasks', 'contacts', 'meals', 'workouts', 'vehicles', 'maintenance', 'memories'];
  if (!mod || !ALLOWED_MODULES.includes(mod)) {
    return badRequest('Invalid module');
  }
  if (format !== 'xlsx' && format !== 'csv') {
    return badRequest('Invalid format');
  }
  const data = getModuleData(mod);
  if (!data.length) return badRequest('No data to export');

  const safeName = (filename || '').replace(/[^a-zA-Z0-9_-]/g, '') || `${mod}-${new Date().toISOString().split('T')[0]}`;
  let result;
  if (format === 'csv') {
    result = generateCSV(data, `${safeName}.csv`);
  } else {
    result = generateExcel(data, mod, `${safeName}.xlsx`);
  }

  logExport({ filename: result.filename, format, module: mod, row_count: data.length });
  return success({ filename: result.filename, rows: data.length });
});
