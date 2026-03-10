import { success, error, badRequest, notFound } from '@/lib/api/response';
import { addVehicle, getVehicles, logMaintenance, getMaintenanceHistory, logFuel, getFuelLogs, getVehicleCosts } from '@/lib/tools/vehicle/queries';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    const view = searchParams.get('view');

    if (vehicleId && view === 'maintenance') return success({ logs: getMaintenanceHistory(vehicleId) });
    if (vehicleId && view === 'fuel') return success({ logs: getFuelLogs(vehicleId) });
    if (vehicleId && view === 'costs') return success(getVehicleCosts(vehicleId));

    return success({ vehicles: getVehicles() });
  } catch (err) {
    return error(err.message);
  }
}

export async function POST(request) {
  try {
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
  } catch (err) {
    return error(err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.id) return badRequest('Vehicle ID required');

    const db = getDb();
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(body.id);
    if (!vehicle) return notFound('Vehicle not found');

    const allowed = ['make', 'model', 'year', 'current_mileage', 'nickname'];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        sets.push(`${key} = ?`);
        vals.push(body[key]);
      }
    }
    if (sets.length === 0) return badRequest('No fields to update');

    vals.push(body.id);
    db.prepare(`UPDATE vehicles SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    return success();
  } catch (err) {
    return error(err.message);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return badRequest('Vehicle ID required');

    const db = getDb();
    db.prepare('DELETE FROM maintenance_logs WHERE vehicle_id = ?').run(id);
    db.prepare('DELETE FROM fuel_logs WHERE vehicle_id = ?').run(id);
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);

    return success();
  } catch (err) {
    return error(err.message);
  }
}
