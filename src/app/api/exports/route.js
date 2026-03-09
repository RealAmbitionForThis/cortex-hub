import { NextResponse } from 'next/server';
import { generateExcel } from '@/lib/export/excel';
import { generateCSV } from '@/lib/export/csv';
import { logExport, getExportHistory, getModuleData } from '@/lib/tools/export/queries';
import fs from 'fs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');

    if (download) {
      const filePath = `exports/${download}`;
      if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });
      const buffer = fs.readFileSync(filePath);
      const ext = download.split('.').pop();
      const contentType = ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      return new NextResponse(buffer, { headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${download}"` } });
    }

    return NextResponse.json({ exports: getExportHistory() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { module: mod, format = 'xlsx', filename } = await request.json();
    const data = getModuleData(mod);
    if (!data.length) return NextResponse.json({ error: 'No data to export' }, { status: 400 });

    const fname = filename || `${mod}-${new Date().toISOString().split('T')[0]}`;
    let result;
    if (format === 'csv') {
      result = generateCSV(data, `${fname}.csv`);
    } else {
      result = generateExcel(data, mod, `${fname}.xlsx`);
    }

    logExport({ filename: result.filename, format, module: mod, row_count: data.length });
    return NextResponse.json({ success: true, filename: result.filename, rows: data.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
