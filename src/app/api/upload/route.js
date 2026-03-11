import { success, badRequest, withHandler } from '@/lib/api/response';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const POST = withHandler(async (request) => {
  const formData = await request.formData();
  const files = formData.getAll('files');
  const category = formData.get('category') || 'documents';

  if (!files || files.length === 0) return badRequest('No files provided');

  // Prevent path traversal
  if (category.includes('..') || path.isAbsolute(category)) {
    return badRequest('Invalid category');
  }

  const targetDir = path.resolve(UPLOAD_DIR, category);
  if (!targetDir.startsWith(UPLOAD_DIR)) {
    return badRequest('Invalid category');
  }
  await mkdir(targetDir, { recursive: true });

  const uploaded = [];

  for (const file of files) {
    if (!file || typeof file === 'string') continue;

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(targetDir, filename);

    await writeFile(filePath, buffer);

    uploaded.push({
      originalName: file.name,
      filename,
      path: `/uploads/${category}/${filename}`,
      size: buffer.length,
      type: file.type,
    });
  }

  return success({ files: uploaded });
});
