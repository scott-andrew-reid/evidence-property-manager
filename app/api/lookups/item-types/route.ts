import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all item types
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const itemTypes = await sql`
      SELECT id, name, category, extended_fields, created_at
      FROM item_types
      ORDER BY category NULLS LAST, name
    `;

    return NextResponse.json({ itemTypes });
  } catch (error: any) {
    console.error('Failed to fetch item types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new item type
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, category, extended_fields } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Check for duplicates
    const existing = await sql`
      SELECT id FROM item_types WHERE LOWER(name) = LOWER(${name})
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Item type already exists' }, { status: 400 });
    }
    
    const result = await sql`
      INSERT INTO item_types (name, category, extended_fields)
      VALUES (${name}, ${category || null}, ${extended_fields || null})
      RETURNING id, name, category, extended_fields, created_at
    `;
    
    return NextResponse.json({ itemType: result[0] });
  } catch (error: any) {
    console.error('Failed to create item type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
