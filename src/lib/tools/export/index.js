import { generateExcel } from '@/lib/export/excel';
import { generateCSV } from '@/lib/export/csv';
import { logExport, getModuleData } from './queries';

export const exportTools = [
  {
    name: 'export.data',
    description: 'Export module data to Excel or CSV',
    parameters: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Data module to export (transactions, tasks, contacts, meals, workouts, vehicles, maintenance, memories)' },
        format: { type: 'string', enum: ['xlsx', 'csv'] },
        filename: { type: 'string' },
      },
      required: ['module'],
    },
    handler: async ({ module: mod, format = 'xlsx', filename }) => {
      const data = getModuleData(mod);
      if (!data.length) return { error: 'No data to export' };

      const fname = filename || `${mod}-${new Date().toISOString().split('T')[0]}`;
      let result;
      if (format === 'csv') {
        result = generateCSV(data, `${fname}.csv`);
      } else {
        result = generateExcel(data, mod, `${fname}.xlsx`);
      }

      logExport({ filename: result.filename, format, module: mod, row_count: data.length });
      return { success: true, filename: result.filename, rows: data.length };
    },
  },
  {
    name: 'export.list',
    description: 'List export history',
    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
    handler: async ({ limit }) => {
      const { getExportHistory } = await import('./queries');
      return { exports: getExportHistory(limit) };
    },
  },
];
