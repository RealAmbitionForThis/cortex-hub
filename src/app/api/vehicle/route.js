import { success, error, badRequest } from '@/lib/api/response';
import { addVehicle, getVehicles, logMaintenance, getMaintenanceHistory, logFuel, getFuelLogs, getVehicleCosts } from '@/lib/tools/vehicle/queries';

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
