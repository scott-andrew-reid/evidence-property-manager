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
      SELECT id, name, building, room, capacity, current_count, notes, active, created_at
      FROM locations
      WHERE active = true
      ORDER BY building NULLS LAST, name
    `;

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new location
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, building, room, capacity, notes } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Check for duplicates
    const existing = await sql`
      SELECT id FROM locations WHERE LOWER(name) = LOWER(${name})
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Location already exists' }, { status: 400 });
    }
    
    const result = await sql`
      INSERT INTO locations (name, building, room, capacity, notes)
      VALUES (
        ${name}, 
        ${building || null}, 
        ${room || null}, 
        ${capacity || null},
        ${notes || null}
      )
      RETURNING id, name, building, room, capacity, current_count, notes, active, created_at
    `;
    
    return NextResponse.json({ location: result[0] });
  } catch (error: any) {
    console.error('Failed to create location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
