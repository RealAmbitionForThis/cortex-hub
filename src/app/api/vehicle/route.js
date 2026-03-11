import { success, badRequest, notFound, withHandler } from '@/lib/api/response';
import { addVehicle, getVehicles, logMaintenance, getMaintenanceHistory, logFuel, getFuelLogs, getVehicleCosts } from '@/lib/tools/vehicle/queries';
import { getDb, updateRow } from '@/lib/db';

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicle_id');
  const view = searchParams.get('view');

  if (vehicleId && view === 'maintenance') return success({ logs: getMaintenanceHistory(vehicleId) });
  if (vehicleId && view === 'fuel') return success({ logs: getFuelLogs(vehicleId) });
  if (vehicleId && view === 'costs') return success(getVehicleCosts(vehicleId));

  return success({ vehicles: getVehicles() });
});

export const POST = withHandler(async (request) => {
  const body = await request.json();
  if (body.action === 'maintenance') {
    if (!body.vehicle_id) return badRequest('Vehicle ID required');
    const id = logMaintenance(body);
    return success({ id });
  }
  if (body.action === 'fuel') {
    if (!body.vehicle_id) return badRequest('Vehicle ID required');
    const id = logFuel(body);
    return success({ id });
  }
  if (!body.make) return badRequest('Vehicle make is required');
  const id = addVehicle(body);
  return success({ id });
});

export const PUT = withHandler(async (request) => {
  const body = await request.json();
  if (!body.id) return badRequest('Vehicle ID required');

  const db = getDb();
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(body.id);
  if (!vehicle) return notFound('Vehicle not found');

  const updated = updateRow('vehicles', body.id, body, ['make', 'model', 'year', 'current_mileage', 'nickname']);
  if (!updated) return badRequest('No fields to update');

  return success();
});

export const DELETE = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('Vehicle ID required');

  const db = getDb();
  db.prepare('DELETE FROM maintenance_logs WHERE vehicle_id = ?').run(id);
  db.prepare('DELETE FROM fuel_logs WHERE vehicle_id = ?').run(id);
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);

  return success();
});
