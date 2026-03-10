import { success, error, badRequest } from '@/lib/api/response';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const category = formData.get('category') || 'documents';

    if (!files || files.length === 0) return badRequest('No files provided');

    const targetDir = path.join(UPLOAD_DIR, category);
    await mkdir(targetDir, { recursive: true });

    const uploaded = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name);
      const filename = `${uuid()}${ext}`;
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
  } catch (err) {
    return error(err.message);
  }
}
