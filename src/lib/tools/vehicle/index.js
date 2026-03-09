import { addVehicle, logMaintenance, getMaintenanceHistory, logFuel, getVehicleCosts, getVehicles } from './queries';

export const vehicleTools = [
  {
    name: 'vehicle.add_vehicle',
    description: 'Add a new vehicle',
    parameters: { type: 'object', properties: { make: { type: 'string' }, model: { type: 'string' }, year: { type: 'number' }, current_mileage: { type: 'number' }, nickname: { type: 'string' } }, required: ['make', 'model', 'year'] },
    handler: (p) => ({ success: true, id: addVehicle(p) }),
  },
  {
    name: 'vehicle.log_maintenance',
    description: 'Log vehicle maintenance',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' }, cost: { type: 'number' }, mileage: { type: 'number' }, shop: { type: 'string' } }, required: ['vehicle_id', 'type'] },
    handler: (p) => ({ success: true, id: logMaintenance(p) }),
  },
  {
    name: 'vehicle.get_history',
    description: 'Get full maintenance history for a vehicle',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' } }, required: ['vehicle_id'] },
    handler: ({ vehicle_id }) => ({ history: getMaintenanceHistory(vehicle_id) }),
  },
  {
    name: 'vehicle.set_reminder',
    description: 'Set a maintenance reminder',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' }, type: { type: 'string' }, mileage_interval: { type: 'number' }, time_interval_days: { type: 'number' } }, required: ['vehicle_id', 'type'] },
    handler: () => ({ message: 'Maintenance reminders are managed through the schedule system' }),
  },
  {
    name: 'vehicle.log_fuel',
    description: 'Log a fuel fill-up',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' }, gallons: { type: 'number' }, cost_per_gallon: { type: 'number' }, total_cost: { type: 'number' }, mileage: { type: 'number' } }, required: ['vehicle_id', 'gallons'] },
    handler: (p) => ({ success: true, id: logFuel(p) }),
  },
  {
    name: 'vehicle.get_costs',
    description: 'Get total cost breakdown for a vehicle',
    parameters: { type: 'object', properties: { vehicle_id: { type: 'string' }, period: { type: 'string' } }, required: ['vehicle_id'] },
    handler: ({ vehicle_id }) => getVehicleCosts(vehicle_id),
  },
];
