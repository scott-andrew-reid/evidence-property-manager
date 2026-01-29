import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all active locations
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const locations = await sql`
      SELECT id, name, location_type, address, capacity, active
      FROM locations
      WHERE active = true
      ORDER BY location_type, name
    `;

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
