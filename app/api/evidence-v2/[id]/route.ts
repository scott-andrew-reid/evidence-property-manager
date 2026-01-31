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
    
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
    }
    
    // Get item details with all relationships
    const items = await sql`
      SELECT 
        e.*,
        t.name as item_type_name,
        t.category as item_type_category,
        t.extended_fields as item_type_fields,
        l.name as current_location_name,
        l.building as current_location_building,
        l.room as current_location_room,
        u1.username as current_custodian_name,
        u1.full_name as current_custodian_full_name,
        u2.username as created_by_name,
        u2.full_name as created_by_full_name
      FROM evidence_items_v2 e
      LEFT JOIN item_types t ON e.item_type_id = t.id
      LEFT JOIN locations l ON e.current_location_id = l.id
      LEFT JOIN users u1 ON e.current_custodian_id = u1.id
      LEFT JOIN users u2 ON e.created_by = u2.id
      WHERE e.id = ${itemId}
      LIMIT 1
    `;
    
    if (items.length === 0) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }
    
    // Get custody transfer history
    const transfers = await sql`
      SELECT 
        ct.*,
        tr.reason as transfer_reason,
        u1.username as from_custodian_name,
        u2.username as to_custodian_name,
        l1.name as from_location_name,
        l2.name as to_location_name,
        u3.username as initiated_by_name
      FROM custody_transfers ct
      LEFT JOIN transfer_reasons tr ON ct.transfer_reason_id = tr.id
      LEFT JOIN users u1 ON ct.from_custodian_id = u1.id
      LEFT JOIN users u2 ON ct.to_custodian_id = u2.id
      LEFT JOIN locations l1 ON ct.from_location_id = l1.id
      LEFT JOIN locations l2 ON ct.to_location_id = l2.id
      LEFT JOIN users u3 ON ct.initiated_by = u3.id
      WHERE ct.evidence_item_id = ${itemId}
      ORDER BY ct.initiated_at DESC
    `;
    
    // Get notes
    const notes = await sql`
      SELECT 
        n.*,
        u.username as created_by_name,
        u.full_name as created_by_full_name
      FROM evidence_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.evidence_item_id = ${itemId}
      ORDER BY n.created_at DESC
    `;
    
    // Get photos
    const photos = await sql`
      SELECT 
        p.*,
        u.username as uploaded_by_name,
        u.full_name as uploaded_by_full_name
      FROM evidence_photos p
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE p.evidence_item_id = ${itemId}
      ORDER BY p.uploaded_at DESC
    `;
    
    return NextResponse.json({ 
      item: items[0], 
      transfers,
      notes,
      photos
    });
  } catch (error: any) {
    console.error('Failed to fetch evidence details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update evidence item
export async function PUT(
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
    const data = await request.json();
    
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
    }
    
    // Check if item exists
    const existing = await sql`
      SELECT id, case_number, item_number 
      FROM evidence_items_v2 
      WHERE id = ${itemId} 
      LIMIT 1
    `;
    
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }
    
    // Check for duplicate case_number + item_number if changed
    if (data.case_number || data.item_number) {
      const checkCase = data.case_number || existing[0].case_number;
      const checkItem = data.item_number || existing[0].item_number;
      
      const duplicate = await sql`
        SELECT id FROM evidence_items_v2 
        WHERE case_number = ${checkCase}
        AND item_number = ${checkItem}
        AND id != ${itemId}
        LIMIT 1
      `;
      
      if (duplicate.length > 0) {
        return NextResponse.json({ 
          error: `Evidence item ${checkCase}-${checkItem} already exists` 
        }, { status: 409 });
      }
    }
    
    // Validate references if provided
    if (data.item_type_id !== undefined && data.item_type_id !== null) {
      const itemType = await sql`SELECT id FROM item_types WHERE id = ${data.item_type_id} LIMIT 1`;
      if (itemType.length === 0) {
        return NextResponse.json({ error: 'Invalid item_type_id' }, { status: 400 });
      }
    }
    
    if (data.current_location_id !== undefined && data.current_location_id !== null) {
      const location = await sql`SELECT id FROM locations WHERE id = ${data.current_location_id} AND active = true LIMIT 1`;
      if (location.length === 0) {
        return NextResponse.json({ error: 'Invalid or inactive location_id' }, { status: 400 });
      }
    }
    
    if (data.current_custodian_id !== undefined && data.current_custodian_id !== null) {
      const custodian = await sql`SELECT id FROM users WHERE id = ${data.current_custodian_id} AND is_active = true LIMIT 1`;
      if (custodian.length === 0) {
        return NextResponse.json({ error: 'Invalid or inactive custodian_id' }, { status: 400 });
      }
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    const updateFields = [
      'case_number', 'item_number', 'description', 'item_type_id',
      'collected_date', 'collected_by', 'collection_location',
      'current_status', 'current_location_id', 'current_custodian_id',
      'chain_of_custody', 'notes'
    ];
    
    for (const field of updateFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }
    
    // Handle extended_fields specially (JSONB)
    if (data.extended_fields !== undefined) {
      updates.push(`extended_fields = $${paramIndex}::jsonb`);
      values.push(data.extended_fields ? JSON.stringify(data.extended_fields) : null);
      paramIndex++;
    }
    
    // Always update updated_at
    updates.push('updated_at = NOW()');
    
    if (updates.length === 1) { // Only updated_at
      return NextResponse.json({ 
        success: true,
        message: 'No changes to update'
      });
    }
    
    // Execute update (using template literal for Neon compatibility)
    await sql`
      UPDATE evidence_items_v2 
      SET 
        case_number = COALESCE(${data.case_number}, case_number),
        item_number = COALESCE(${data.item_number}, item_number),
        description = COALESCE(${data.description}, description),
        item_type_id = COALESCE(${data.item_type_id}, item_type_id),
        collected_date = COALESCE(${data.collected_date}, collected_date),
        collected_by = COALESCE(${data.collected_by}, collected_by),
        collection_location = COALESCE(${data.collection_location}, collection_location),
        current_status = COALESCE(${data.current_status}, current_status),
        current_location_id = COALESCE(${data.current_location_id}, current_location_id),
        current_custodian_id = COALESCE(${data.current_custodian_id}, current_custodian_id),
        extended_fields = COALESCE(${data.extended_fields ? JSON.stringify(data.extended_fields) : null}::jsonb, extended_fields),
        chain_of_custody = COALESCE(${data.chain_of_custody}, chain_of_custody),
        notes = COALESCE(${data.notes}, notes),
        updated_at = NOW()
      WHERE id = ${itemId}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Evidence item updated successfully'
    });
  } catch (error: any) {
    console.error('Failed to update evidence item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE evidence item
export async function DELETE(
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
    
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
    }
    
    // Check if item exists
    const existing = await sql`
      SELECT id, case_number, item_number 
      FROM evidence_items_v2 
      WHERE id = ${itemId} 
      LIMIT 1
    `;
    
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }
    
    // Check for related records (custody transfers)
    const transfers = await sql`
      SELECT COUNT(*) as count 
      FROM custody_transfers 
      WHERE evidence_item_id = ${itemId}
    `;
    
    if (transfers[0].count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete evidence item with custody transfer history. Consider marking as disposed instead.'
      }, { status: 409 });
    }
    
    // Delete related notes and photos first
    await sql`DELETE FROM evidence_notes WHERE evidence_item_id = ${itemId}`;
    await sql`DELETE FROM evidence_photos WHERE evidence_item_id = ${itemId}`;
    
    // Delete the item
    await sql`DELETE FROM evidence_items_v2 WHERE id = ${itemId}`;

    return NextResponse.json({ 
      success: true,
      message: 'Evidence item deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete evidence item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
