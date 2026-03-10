import { addInventoryItem, getInventoryItems, getInventoryItem, updateInventoryItem, deleteInventoryItem, getExpiringWarranties, getExpiredWarranties, getInventoryStats, addWarrantyClaim, getWarrantyClaims, updateWarrantyClaim } from './queries';

export const inventoryTools = [
  {
    name: 'inventory.add_item',
    description: 'Add an item to inventory with purchase date, warranty info, and receipt',
    parameters: { type: 'object', properties: { name: { type: 'string' }, manufacturer: { type: 'string' }, model: { type: 'string' }, serial_number: { type: 'string' }, purchase_date: { type: 'string' }, purchase_price: { type: 'number' }, warranty_expiry: { type: 'string' }, warranty_type: { type: 'string' }, warranty_provider: { type: 'string' }, coverage_details: { type: 'string' }, category: { type: 'string' }, location: { type: 'string' }, notes: { type: 'string' } }, required: ['name'] },
    handler: (p) => ({ success: true, id: addInventoryItem(p) }),
  },
  {
    name: 'inventory.get_items',
    description: 'Get inventory items with optional filtering by category, status, or search term',
    parameters: { type: 'object', properties: { category: { type: 'string' }, status: { type: 'string' }, search: { type: 'string' } } },
    handler: (p) => ({ items: getInventoryItems(p), stats: getInventoryStats() }),
  },
  {
    name: 'inventory.get_item',
    description: 'Get detailed info about a specific inventory item including warranty claims',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    handler: ({ id }) => {
      const item = getInventoryItem(id);
      if (!item) return { error: 'Item not found' };
      const claims = getWarrantyClaims(id);
      return { item, claims };
    },
  },
  {
    name: 'inventory.update_item',
    description: 'Update an inventory item',
    parameters: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, warranty_expiry: { type: 'string' }, status: { type: 'string' }, notes: { type: 'string' }, location: { type: 'string' } }, required: ['id'] },
    handler: ({ id, ...updates }) => { updateInventoryItem(id, updates); return { success: true }; },
  },
  {
    name: 'inventory.delete_item',
    description: 'Delete an inventory item',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    handler: ({ id }) => { deleteInventoryItem(id); return { success: true }; },
  },
  {
    name: 'inventory.check_warranties',
    description: 'Check for expiring or expired warranties',
    parameters: { type: 'object', properties: { days: { type: 'number', description: 'Days ahead to check (default 90)' } } },
    handler: ({ days }) => ({
      expiring: getExpiringWarranties(days || 90),
      expired: getExpiredWarranties(),
    }),
  },
  {
    name: 'inventory.add_claim',
    description: 'File a warranty claim for an inventory item',
    parameters: { type: 'object', properties: { inventory_item_id: { type: 'string' }, description: { type: 'string' }, claim_date: { type: 'string' }, cost: { type: 'number' } }, required: ['inventory_item_id', 'description'] },
    handler: (p) => ({ success: true, id: addWarrantyClaim(p) }),
  },
  {
    name: 'inventory.update_claim',
    description: 'Update a warranty claim status or resolution',
    parameters: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' }, resolution: { type: 'string' }, cost: { type: 'number' } }, required: ['id'] },
    handler: ({ id, ...updates }) => { updateWarrantyClaim(id, updates); return { success: true }; },
  },
];
