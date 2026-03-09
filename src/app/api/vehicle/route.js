import { NextResponse } from 'next/server';
import { addVehicle, getVehicles, logMaintenance, getMaintenanceHistory, logFuel, getFuelLogs, getVehicleCosts } from '@/lib/tools/vehicle/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    const view = searchParams.get('view');

    if (vehicleId && view === 'maintenance') return NextResponse.json({ logs: getMaintenanceHistory(vehicleId) });
    if (vehicleId && view === 'fuel') return NextResponse.json({ logs: getFuelLogs(vehicleId) });
    if (vehicleId && view === 'costs') return NextResponse.json(getVehicleCosts(vehicleId));

    return NextResponse.json({ vehicles: getVehicles() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'maintenance') { const id = logMaintenance(body); return NextResponse.json({ id, success: true }); }
    if (body.action === 'fuel') { const id = logFuel(body); return NextResponse.json({ id, success: true }); }
    const id = addVehicle(body);
    return NextResponse.json({ id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
