import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// PATCH update lookup item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string, id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, id } = await params;
    const itemId = parseInt(id);
    const updates = await request.json();
    const sql = getDb();
    
    let result;
    
    switch (type) {
      case 'item-types':
        if (!updates.name) {
          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        result = await sql`
          UPDATE item_types
          SET name = ${updates.name}, category = ${updates.category || null}
          WHERE id = ${itemId}
          RETURNING *
        `;
        break;
        
      case 'locations':
        if (!updates.name) {
          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        result = await sql`
          UPDATE locations
          SET name = ${updates.name}
          WHERE id = ${itemId}
          RETURNING *
        `;
        break;
        
      case 'analysts':
        result = await sql`
          UPDATE analysts
          SET 
            analyst_id = ${updates.analyst_id || null},
            full_name = ${updates.full_name || null},
            email = ${updates.email || null}
          WHERE id = ${itemId}
          RETURNING *
        `;
        break;
        
      case 'transfer-reasons':
        if (!updates.reason) {
          return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }
        result = await sql`
          UPDATE transfer_reasons
          SET reason = ${updates.reason}
          WHERE id = ${itemId}
          RETURNING *
        `;
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    return NextResponse.json({ item: result[0] });
  } catch (error: any) {
    console.error('Failed to update lookup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE lookup item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string, id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, id } = await params;
    const itemId = parseInt(id);
    const sql = getDb();
    
    switch (type) {
      case 'item-types':
        await sql`DELETE FROM item_types WHERE id = ${itemId}`;
        break;
      case 'locations':
        await sql`DELETE FROM locations WHERE id = ${itemId}`;
        break;
      case 'analysts':
        await sql`DELETE FROM analysts WHERE id = ${itemId}`;
        break;
      case 'transfer-reasons':
        await sql`DELETE FROM transfer_reasons WHERE id = ${itemId}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete lookup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
