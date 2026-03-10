import { success, error, badRequest } from '@/lib/api/response';
import { addWishlistItem, getWishlistItems, markWishlistPurchased, deleteWishlistItem, getWishlistBudgetInsight } from '@/lib/tools/money/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority') || undefined;
    const category = searchParams.get('category') || undefined;
    const purchased = searchParams.get('purchased');
    const view = searchParams.get('view');

    if (view === 'insight') {
      return success(getWishlistBudgetInsight());
    }

    const items = getWishlistItems({
      priority,
      category,
      purchased: purchased !== null ? purchased === 'true' : undefined,
    });
    const insight = getWishlistBudgetInsight();
    return success({ items, insight });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.action === 'mark_purchased') {
      if (!body.id) return badRequest('Item ID required');
      markWishlistPurchased(body.id);
      return success();
    }

    if (body.action === 'delete') {
      if (!body.id) return badRequest('Item ID required');
      deleteWishlistItem(body.id);
      return success();
    }

    if (!body.name) return badRequest('Name is required');
    const id = addWishlistItem(body);
    return success({ id });
  } catch (err) {
    return error(err.message);
  }
}
