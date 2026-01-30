import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET single location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const sql = getDb();
    
    const result = await sql`
      SELECT id, name, building, room, capacity, current_count, notes, active, created_at
      FROM locations
      WHERE id = ${parseInt(id)}
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json({ location: result[0] });
  } catch (error: any) {
    console.error('Failed to fetch location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, building, room, capacity, notes, active } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Check for duplicate names (excluding current record)
    const existing = await sql`
      SELECT id FROM locations 
      WHERE LOWER(name) = LOWER(${name})
      AND id != ${parseInt(id)}
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Location name already exists' }, { status: 400 });
    }
    
    const result = await sql`
      UPDATE locations
      SET name = ${name},
          building = ${building || null},
          room = ${room || null},
          capacity = ${capacity || null},
          notes = ${notes || null},
          active = ${active !== undefined ? active : true}
      WHERE id = ${parseInt(id)}
      RETURNING id, name, building, room, capacity, current_count, notes, active, created_at
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json({ location: result[0] });
  } catch (error: any) {
    console.error('Failed to update location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const sql = getDb();
    
    // Check if location is in use
    const inUse = await sql`
      SELECT COUNT(*) as count
      FROM evidence_items_v2
      WHERE current_location_id = ${parseInt(id)}
    `;
    
    if (parseInt(inUse[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete location that is currently in use. Consider marking it inactive instead.' 
      }, { status: 400 });
    }
    
    const result = await sql`
      DELETE FROM locations
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
