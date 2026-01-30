import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET single item type
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
      SELECT id, name, category, extended_fields, created_at
      FROM item_types
      WHERE id = ${parseInt(id)}
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 });
    }
    
    return NextResponse.json({ itemType: result[0] });
  } catch (error: any) {
    console.error('Failed to fetch item type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update item type
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
    const { name, category, extended_fields } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Check for duplicate names (excluding current record)
    const existing = await sql`
      SELECT id FROM item_types 
      WHERE LOWER(name) = LOWER(${name})
      AND id != ${parseInt(id)}
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Item type name already exists' }, { status: 400 });
    }
    
    const result = await sql`
      UPDATE item_types
      SET name = ${name},
          category = ${category || null},
          extended_fields = ${extended_fields || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, name, category, extended_fields, created_at
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 });
    }
    
    return NextResponse.json({ itemType: result[0] });
  } catch (error: any) {
    console.error('Failed to update item type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE item type
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
    
    // Check if item type is in use
    const inUse = await sql`
      SELECT COUNT(*) as count
      FROM evidence_items_v2
      WHERE item_type_id = ${parseInt(id)}
    `;
    
    if (parseInt(inUse[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete item type that is in use by evidence items' 
      }, { status: 400 });
    }
    
    const result = await sql`
      DELETE FROM item_types
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Item type not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete item type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
