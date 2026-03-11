import { success, badRequest, withHandler } from '@/lib/api/response';
import { importFile } from '@/lib/export/importer';

export const POST = withHandler(async (request) => {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return badRequest('No file provided');

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importFile(buffer, file.name);
  return success(result);
});
