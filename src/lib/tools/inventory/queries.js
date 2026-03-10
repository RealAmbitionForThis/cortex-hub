import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// --- Inventory Items ---

export function addInventoryItem({ name, manufacturer, model, serial_number, purchase_date, purchase_price, warranty_expiry, warranty_type, warranty_provider, coverage_details, receipt_document_id, category, location, notes }) {
  const id = uuidv4();
  getDb().prepare(
    `INSERT INTO inventory_items (id, name, manufacturer, model, serial_number, purchase_date, purchase_price, warranty_expiry, warranty_type, warranty_provider, coverage_details, receipt_document_id, category, location, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, name, manufacturer || null, model || null, serial_number || null, purchase_date || null, purchase_price || null, warranty_expiry || null, warranty_type || 'standard', warranty_provider || null, coverage_details || null, receipt_document_id || null, category || 'other', location || null, notes || null);
  return id;
}

export function getInventoryItems({ category, status, search } = {}) {
  let query = 'SELECT * FROM inventory_items WHERE 1=1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (name LIKE ? OR manufacturer LIKE ? OR model LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY created_at DESC';
  return getDb().prepare(query).all(...params);
}

export function getInventoryItem(id) {
  return getDb().prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
}

export function updateInventoryItem(id, updates) {
  const allowed = ['name', 'manufacturer', 'model', 'serial_number', 'purchase_date', 'purchase_price', 'warranty_expiry', 'warranty_type', 'warranty_provider', 'coverage_details', 'receipt_document_id', 'category', 'location', 'notes', 'status'];
  const sets = [];
  const vals = [];
  for (const [key, val] of Object.entries(updates)) {
    if (allowed.includes(key) && val !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(val);
    }
  }
  if (sets.length === 0) return;
  vals.push(id);
  getDb().prepare(`UPDATE inventory_items SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

export function deleteInventoryItem(id) {
  getDb().prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
}

export function getExpiringWarranties(days = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return getDb().prepare(
    "SELECT * FROM inventory_items WHERE warranty_expiry IS NOT NULL AND warranty_expiry <= ? AND warranty_expiry >= date('now') AND status = 'active' ORDER BY warranty_expiry ASC"
  ).all(cutoff.toISOString().split('T')[0]);
}

export function getExpiredWarranties() {
  return getDb().prepare(
    "SELECT * FROM inventory_items WHERE warranty_expiry IS NOT NULL AND warranty_expiry < date('now') AND status = 'active' ORDER BY warranty_expiry DESC"
  ).all();
}

export function getInventoryStats() {
  const db = getDb();
  const totalItems = db.prepare("SELECT COUNT(*) as count FROM inventory_items WHERE status = 'active'").get();
  const totalValue = db.prepare("SELECT COALESCE(SUM(purchase_price), 0) as total FROM inventory_items WHERE status = 'active'").get();
  const expiringCount = db.prepare(
    "SELECT COUNT(*) as count FROM inventory_items WHERE warranty_expiry IS NOT NULL AND warranty_expiry BETWEEN date('now') AND date('now', '+90 days') AND status = 'active'"
  ).get();
  const expiredCount = db.prepare(
    "SELECT COUNT(*) as count FROM inventory_items WHERE warranty_expiry IS NOT NULL AND warranty_expiry < date('now') AND status = 'active'"
  ).get();
  return {
    total_items: totalItems.count,
    total_value: totalValue.total,
    expiring_soon: expiringCount.count,
    expired: expiredCount.count,
  };
}

// --- Warranty Claims ---

export function addWarrantyClaim({ inventory_item_id, description, claim_date, status, cost, notes }) {
  const id = uuidv4();
  getDb().prepare(
    `INSERT INTO warranty_claims (id, inventory_item_id, claim_date, description, status, cost, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, inventory_item_id, claim_date || new Date().toISOString().split('T')[0], description, status || 'pending', cost || 0, notes || null);
  return id;
}

export function getWarrantyClaims(inventory_item_id) {
  return getDb().prepare('SELECT * FROM warranty_claims WHERE inventory_item_id = ? ORDER BY claim_date DESC').all(inventory_item_id);
}

export function updateWarrantyClaim(id, updates) {
  const allowed = ['description', 'status', 'resolution', 'cost', 'notes'];
  const sets = [];
  const vals = [];
  for (const [key, val] of Object.entries(updates)) {
    if (allowed.includes(key) && val !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(val);
    }
  }
  if (sets.length === 0) return;
  vals.push(id);
  getDb().prepare(`UPDATE warranty_claims SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}
