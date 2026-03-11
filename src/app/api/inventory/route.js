import { success, error, badRequest, notFound } from '@/lib/api/response';
import { addInventoryItem, getInventoryItems, getInventoryItem, updateInventoryItem, deleteInventoryItem, getExpiringWarranties, getInventoryStats, addWarrantyClaim, getWarrantyClaims, updateWarrantyClaim } from '@/lib/tools/inventory/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const id = searchParams.get('id');

    if (view === 'stats') {
      return success(getInventoryStats());
    }

    if (view === 'expiring') {
      const days = parseInt(searchParams.get('days')) || 90;
      return success({ items: getExpiringWarranties(days) });
    }

    if (view === 'claims' && id) {
      return success({ claims: getWarrantyClaims(id) });
    }

    if (id) {
      const item = getInventoryItem(id);
      if (!item) return notFound('Item not found');
      const claims = getWarrantyClaims(id);
      return success({ item, claims });
    }

    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const items = getInventoryItems({ category, status, search });
    const stats = getInventoryStats();
    return success({ items, stats });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.action === 'update') {
      if (!body.id) return badRequest('Item ID required');
      updateInventoryItem(body.id, body);
      return success();
    }

    if (body.action === 'delete') {
      if (!body.id) return badRequest('Item ID required');
      deleteInventoryItem(body.id);
      return success();
    }

    if (body.action === 'add_claim') {
      if (!body.inventory_item_id || !body.description) return badRequest('Item ID and description required');
      const id = addWarrantyClaim(body);
      return success({ id });
    }

    if (body.action === 'update_claim') {
      if (!body.id) return badRequest('Claim ID required');
      updateWarrantyClaim(body.id, body);
      return success();
    }

    if (!body.name) return badRequest('Name is required');
    const id = addInventoryItem(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}
