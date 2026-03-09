import { success, error, badRequest } from '@/lib/api/response';
import { importFile } from '@/lib/export/importer';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return badRequest('No file provided');

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importFile(buffer, file.name);
    return success(result);
  } catch (err) {
    return error(err.message);
  }
}
