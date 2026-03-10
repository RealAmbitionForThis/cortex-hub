import { generateCompletion } from '@/lib/llm/provider';

export async function scanDocument(imageBase64, type = 'receipt') {
  const prompts = {
    receipt: `Analyze this receipt image. Extract: store name, date, items with prices, subtotal, tax, total. Return JSON: { "store": "", "date": "", "items": [{"name":"","price":0}], "subtotal": 0, "tax": 0, "total": 0 }`,
    document: `Analyze this document image. Extract all text content and key information. Return JSON: { "title": "", "content": "", "key_info": {} }`,
    business_card: `Analyze this business card image. Extract: name, title, company, phone, email, address. Return JSON: { "name": "", "title": "", "company": "", "phone": "", "email": "", "address": "" }`,
    warranty: `Analyze this warranty/receipt image. Extract: item name, manufacturer, purchase date, warranty duration/expiry, coverage type, serial number if visible, store/vendor, purchase price. Return JSON: { "item_name": "", "manufacturer": "", "purchase_date": "", "warranty_expiry": "", "warranty_type": "", "serial_number": "", "vendor": "", "purchase_price": 0 }`,
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
