import { success, error, badRequest } from '@/lib/api/response';
import { scanDocument } from '@/lib/docs/scanner';
import { addDocument } from '@/lib/tools/docs/queries';

const VALID_SCAN_TYPES = ['receipt', 'document', 'business_card'];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'receipt';

    if (!file) return badRequest('No file provided');
    if (!VALID_SCAN_TYPES.includes(type)) return badRequest('Invalid scan type');

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const result = await scanDocument(base64, type);

    if (!result.error) {
      const title = result.store || result.title || `Scanned ${type}`;
      const id = addDocument({ title, type: 'receipt', content: JSON.stringify(result), metadata: result });
      return success({ id, result });
    }

    return success({ result });
  } catch (err) {
    return error(err.message);
  }
}
