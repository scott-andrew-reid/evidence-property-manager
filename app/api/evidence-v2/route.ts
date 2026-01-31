import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all evidence items with search and filter
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    
    // Extract filters
    const search = searchParams.get('search');
    const caseNumber = searchParams.get('case');
    const status = searchParams.get('status');
    const locationId = searchParams.get('location');
    const typeId = searchParams.get('type');
    const custodianId = searchParams.get('custodian');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Fetch all items with joins
    let items = await sql`
      SELECT 
        e.*,
        t.name as item_type_name,
        t.category as item_type_category,
        t.extended_fields as item_type_fields,
        l.name as current_location_name,
        l.building as current_location_building,
        u1.username as current_custodian_name,
        u2.username as created_by_name
      FROM evidence_items_v2 e
      LEFT JOIN item_types t ON e.item_type_id = t.id
      LEFT JOIN locations l ON e.current_location_id = l.id
      LEFT JOIN users u1 ON e.current_custodian_id = u1.id
      LEFT JOIN users u2 ON e.created_by = u2.id
      ORDER BY e.created_at DESC
    `;
    
    // Apply filters in JavaScript (for Neon serverless compatibility)
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.case_number?.toLowerCase().includes(searchLower) ||
        item.item_number?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.collection_location?.toLowerCase().includes(searchLower)
      );
    }
    
    if (caseNumber) {
      items = items.filter(item => item.case_number === caseNumber);
    }
    
    if (status) {
      items = items.filter(item => item.current_status === status);
    }
    
    if (locationId) {
      items = items.filter(item => item.current_location_id === parseInt(locationId));
    }
    
    if (typeId) {
      items = items.filter(item => item.item_type_id === parseInt(typeId));
    }
    
    if (custodianId) {
      items = items.filter(item => item.current_custodian_id === parseInt(custodianId));
    }

    // Pagination
    const total = items.length;
    items = items.slice(offset, offset + limit);

    return NextResponse.json({ 
      items,
      total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Failed to fetch evidence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST new evidence item
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const sql = getDb();
    
    // Validate required fields
    if (!data.case_number || !data.item_number || !data.description || !data.collected_date || !data.collected_by) {
      return NextResponse.json({ 
        error: 'Missing required fields: case_number, item_number, description, collected_date, collected_by' 
      }, { status: 400 });
    }
    
    // Check for duplicate case_number + item_number
    const existing = await sql`
      SELECT id FROM evidence_items_v2 
      WHERE case_number = ${data.case_number} 
      AND item_number = ${data.item_number}
      LIMIT 1
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ 
        error: `Evidence item ${data.case_number}-${data.item_number} already exists` 
      }, { status: 409 });
    }
    
    // Validate item_type_id if provided
    if (data.item_type_id) {
      const itemType = await sql`SELECT id, extended_fields FROM item_types WHERE id = ${data.item_type_id} LIMIT 1`;
      if (itemType.length === 0) {
        return NextResponse.json({ error: 'Invalid item_type_id' }, { status: 400 });
      }
    }
    
    // Validate location_id if provided
    if (data.current_location_id) {
      const location = await sql`SELECT id FROM locations WHERE id = ${data.current_location_id} AND active = true LIMIT 1`;
      if (location.length === 0) {
        return NextResponse.json({ error: 'Invalid or inactive location_id' }, { status: 400 });
      }
    }
    
    // Validate custodian_id if provided
    if (data.current_custodian_id) {
      const custodian = await sql`SELECT id FROM users WHERE id = ${data.current_custodian_id} AND is_active = true LIMIT 1`;
      if (custodian.length === 0) {
        return NextResponse.json({ error: 'Invalid or inactive custodian_id' }, { status: 400 });
      }
    }
    
    // Insert evidence item with extended_fields as JSONB
    const result = await sql`
      INSERT INTO evidence_items_v2 (
        case_number, 
        item_number, 
        description,
        item_type_id,
        extended_fields,
        collected_date, 
        collected_by, 
        collection_location,
        current_status, 
        current_location_id, 
        current_custodian_id,
        chain_of_custody,
        notes,
        created_by
      ) VALUES (
        ${data.case_number},
        ${data.item_number},
        ${data.description},
        ${data.item_type_id || null},
        ${data.extended_fields ? JSON.stringify(data.extended_fields) : null}::jsonb,
        ${data.collected_date},
        ${data.collected_by},
        ${data.collection_location || null},
        ${data.current_status || 'stored'},
        ${data.current_location_id || null},
        ${data.current_custodian_id || null},
        ${data.chain_of_custody || null},
        ${data.notes || null},
        ${user.userId}
      )
      RETURNING id
    `;

    const newId = result[0].id;
    
    // Create initial custody transfer record if custodian provided
    if (data.current_custodian_id) {
      const receiptReason = await sql`SELECT id FROM transfer_reasons WHERE reason = 'Initial Evidence Receipt' LIMIT 1`;
      const receiptNumber = `RCP-${String(newId).padStart(6, '0')}-${Date.now()}`;
      
      if (receiptReason.length > 0) {
        await sql`
          INSERT INTO custody_transfers (
            evidence_item_id,
            transfer_type,
            transfer_reason_id,
            transfer_reason_text,
            to_custodian_id,
            to_location_id,
            condition_notes,
            status,
            receipt_number,
            initiated_by,
            completed_at
          ) VALUES (
            ${newId},
            'receipt',
            ${receiptReason[0].id},
            'Initial Evidence Receipt',
            ${data.current_custodian_id},
            ${data.current_location_id || null},
            ${data.notes || 'Initial receipt into evidence system'},
            'completed',
            ${receiptNumber},
            ${user.userId},
            NOW()
          )
        `;
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: newId,
      message: 'Evidence item created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create evidence item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
