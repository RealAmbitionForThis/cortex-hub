import { addVehicle, logMaintenance, getMaintenanceHistory, logFuel, getVehicleCosts, getVehicles, getFuelLogs } from './queries';
import { getDb } from '@/lib/db';

export const vehicleTools = [
  {
    name: 'vehicle.get_vehicles',
    description: 'List all vehicles the user owns. Use this first to find vehicle IDs before querying specific vehicle data.',
    parameters: { type: 'object', properties: {} },
    handler: () => ({ vehicles: getVehicles() }),
  },
  {
    name: 'vehicle.add_vehicle',
    description: 'Add a new vehicle',
    parameters: { type: 'object', properties: { make: { type: 'string' }, model: { type: 'string' }, year: { type: 'number' }, current_mileage: { type: 'number' }, nickname: { type: 'string' } }, required: ['make', 'model', 'year'] },
    handler: (p) => ({ success: true, id: addVehicle(p) }),
  },
  {
    name: 'vehicle.update_vehicle',
    description: 'Update a vehicle\'s info (nickname, mileage, etc)',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' }, make: { type: 'string' }, model: { type: 'string' }, year: { type: 'number' }, current_mileage: { type: 'number' }, nickname: { type: 'string' } }, required: ['vehicle_id'] },
    handler: ({ vehicle_id, ...updates }) => {
      const db = getDb();
      const sets = [];
      const vals = [];
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
      }
      if (sets.length === 0) return { success: false, error: 'No fields to update' };
      vals.push(vehicle_id);
      db.prepare(`UPDATE vehicles SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      return { success: true };
    },
  },
  {
    name: 'vehicle.log_maintenance',
    description: 'Log vehicle maintenance',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' }, cost: { type: 'number' }, mileage: { type: 'number' }, shop: { type: 'string' } }, required: ['vehicle_id', 'type'] },
    handler: (p) => ({ success: true, id: logMaintenance(p) }),
  },
  {
    name: 'vehicle.get_history',
    description: 'Get full maintenance history for a vehicle. Use vehicle.get_vehicles first to find the vehicle_id.',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' } }, required: ['vehicle_id'] },
    handler: ({ vehicle_id }) => ({ history: getMaintenanceHistory(vehicle_id) }),
  },
  {
    name: 'vehicle.log_fuel',
    description: 'Log a fuel fill-up',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' }, gallons: { type: 'number' }, cost_per_gallon: { type: 'number' }, total_cost: { type: 'number' }, mileage: { type: 'number' } }, required: ['vehicle_id', 'gallons'] },
    handler: (p) => ({ success: true, id: logFuel(p) }),
  },
  {
    name: 'vehicle.get_fuel_logs',
    description: 'Get fuel fill-up history for a vehicle',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' } }, required: ['vehicle_id'] },
    handler: ({ vehicle_id }) => ({ logs: getFuelLogs(vehicle_id) }),
  },
  {
    name: 'vehicle.get_costs',
    description: 'Get total cost breakdown (maintenance + fuel) for a vehicle',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' } }, required: ['vehicle_id'] },
    handler: ({ vehicle_id }) => getVehicleCosts(vehicle_id),
  },
];
