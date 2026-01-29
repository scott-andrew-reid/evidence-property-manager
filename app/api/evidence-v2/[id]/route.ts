import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET single evidence item with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const { id } = await params;
    const itemId = parseInt(id);
    
    // Get item details
    const items = await sql`
      SELECT 
        e.*,
        t.name as item_type_name,
        t.category as item_type_category,
        l.name as current_location_name,
        a.full_name as current_custodian_name,
        u.full_name as created_by_name
      FROM evidence_items_v2 e
      LEFT JOIN item_types t ON e.item_type_id = t.id
      LEFT JOIN locations l ON e.current_location_id = l.id
      LEFT JOIN analysts a ON e.current_custodian_id = a.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ${itemId}
      LIMIT 1
    `;
    
    if (items.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    // Get notes (create table if needed - will add in next phase)
    const notes: any[] = [];
    
    return NextResponse.json({ item: items[0], notes });
  } catch (error: any) {
    console.error('Failed to fetch evidence details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
