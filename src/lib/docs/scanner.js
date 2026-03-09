import { generateCompletion } from '@/lib/llm/client';

export async function scanDocument(imageBase64, type = 'receipt') {
  const prompts = {
    receipt: `Analyze this receipt image. Extract: store name, date, items with prices, subtotal, tax, total. Return JSON: { "store": "", "date": "", "items": [{"name":"","price":0}], "subtotal": 0, "tax": 0, "total": 0 }`,
    document: `Analyze this document image. Extract all text content and key information. Return JSON: { "title": "", "content": "", "key_info": {} }`,
    business_card: `Analyze this business card image. Extract: name, title, company, phone, email, address. Return JSON: { "name": "", "title": "", "company": "", "phone": "", "email": "", "address": "" }`,
  };

  const prompt = prompts[type] || prompts.document;

  try {
    const result = await generateCompletion({
      prompt,
      images: [imageBase64],
      model: process.env.CORTEX_DEFAULT_VISION_MODEL || 'llava',
    });
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result };
  } catch (error) {
    return { error: error.message };
  }
}
