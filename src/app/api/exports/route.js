import { NextResponse } from 'next/server';
import { generateExcel } from '@/lib/export/excel';
import { generateCSV } from '@/lib/export/csv';
import { logExport, getExportHistory, getModuleData } from '@/lib/tools/export/queries';
import fs from 'fs';
import path from 'path';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');

    if (download) {
      const sanitized = path.basename(download);
      if (!/^[\w.\-]+$/.test(sanitized)) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
      }
      const filePath = path.join(EXPORTS_DIR, sanitized);
      if (!filePath.startsWith(EXPORTS_DIR) || !fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const buffer = fs.readFileSync(filePath);
      const ext = sanitized.split('.').pop();
      const contentType = ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      return new NextResponse(buffer, { headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${sanitized}"` } });
    }

    return NextResponse.json({ exports: getExportHistory() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { module: mod, format = 'xlsx', filename } = await request.json();
    const ALLOWED_MODULES = ['transactions', 'tasks', 'contacts', 'meals', 'workouts', 'vehicles', 'maintenance', 'memories'];
    if (!mod || !ALLOWED_MODULES.includes(mod)) {
      return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }
    if (format !== 'xlsx' && format !== 'csv') {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
    const data = getModuleData(mod);
    if (!data.length) return NextResponse.json({ error: 'No data to export' }, { status: 400 });

    const safeName = (filename || '').replace(/[^a-zA-Z0-9_-]/g, '') || `${mod}-${new Date().toISOString().split('T')[0]}`;
    let result;
    if (format === 'csv') {
      result = generateCSV(data, `${safeName}.csv`);
    } else {
      result = generateExcel(data, mod, `${safeName}.xlsx`);
    }

    logExport({ filename: result.filename, format, module: mod, row_count: data.length });
    return NextResponse.json({ success: true, filename: result.filename, rows: data.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
