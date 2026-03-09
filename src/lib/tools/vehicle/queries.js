import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export function addVehicle({ make, model, year, current_mileage, nickname }) {
  const id = uuidv4();
  getDb().prepare('INSERT INTO vehicles (id, make, model, year, current_mileage, nickname, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))').run(id, make, model, year, current_mileage || null, nickname || null);
  return id;
}

export function getVehicles() {
  return getDb().prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
}

export function logMaintenance({ vehicle_id, type, description, cost, mileage, shop, date }) {
  const id = uuidv4();
  getDb().prepare('INSERT INTO maintenance_logs (id, vehicle_id, type, description, cost, mileage, shop, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))').run(id, vehicle_id, type, description || null, cost || null, mileage || null, shop || null, date || new Date().toISOString().split('T')[0]);
  return id;
}

export function getMaintenanceHistory(vehicleId) {
  return getDb().prepare('SELECT * FROM maintenance_logs WHERE vehicle_id = ? ORDER BY date DESC').all(vehicleId);
}

export function logFuel({ vehicle_id, gallons, cost_per_gallon, total_cost, mileage, date }) {
  const id = uuidv4();
  getDb().prepare('INSERT INTO fuel_logs (id, vehicle_id, gallons, cost_per_gallon, total_cost, mileage, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))').run(id, vehicle_id, gallons, cost_per_gallon || null, total_cost || null, mileage || null, date || new Date().toISOString().split('T')[0]);
  return id;
}

export function getFuelLogs(vehicleId) {
  return getDb().prepare('SELECT * FROM fuel_logs WHERE vehicle_id = ? ORDER BY date DESC').all(vehicleId);
}

export function getVehicleCosts(vehicleId) {
  const db = getDb();
  const maintenance = db.prepare('SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_logs WHERE vehicle_id = ?').get(vehicleId);
  const fuel = db.prepare('SELECT COALESCE(SUM(total_cost), 0) as total FROM fuel_logs WHERE vehicle_id = ?').get(vehicleId);
  return { maintenance: maintenance.total, fuel: fuel.total, total: maintenance.total + fuel.total };
}
