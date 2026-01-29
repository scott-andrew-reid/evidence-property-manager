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
    
    // Build query with filters
    let query = sql`
      SELECT 
        e.*,
        t.name as item_type_name,
        t.category as item_type_category,
        l.name as current_location_name,
        a.full_name as current_custodian_name,
        a.badge_number as current_custodian_badge,
        u.full_name as created_by_name
      FROM evidence_items_v2 e
      LEFT JOIN item_types t ON e.item_type_id = t.id
      LEFT JOIN locations l ON e.current_location_id = l.id
      LEFT JOIN analysts a ON e.current_custodian_id = a.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    
    // Apply filters
    const conditions = [];
    const params: any[] = [];
    
    if (search) {
      conditions.push(sql`(
        e.case_number ILIKE ${'%' + search + '%'} OR
        e.item_number ILIKE ${'%' + search + '%'} OR
        e.description ILIKE ${'%' + search + '%'} OR
        e.serial_number ILIKE ${'%' + search + '%'} OR
        e.make_model ILIKE ${'%' + search + '%'}
      )`);
    }
    
    if (caseNumber) {
      conditions.push(sql`e.case_number = ${caseNumber}`);
    }
    
    if (status) {
      conditions.push(sql`e.current_status = ${status}`);
    }
    
    if (locationId) {
      conditions.push(sql`e.current_location_id = ${parseInt(locationId)}`);
    }
    
    if (typeId) {
      conditions.push(sql`e.item_type_id = ${parseInt(typeId)}`);
    }
    
    if (custodianId) {
      conditions.push(sql`e.current_custodian_id = ${parseInt(custodianId)}`);
    }
    
    // For simplicity with neon serverless, let's fetch all and filter in memory for now
    // In production with large datasets, you'd want proper parameterized queries
    let items = await sql`
      SELECT 
        e.*,
        t.name as item_type_name,
        t.category as item_type_category,
        l.name as current_location_name,
        a.full_name as current_custodian_name,
        a.badge_number as current_custodian_badge,
        u.full_name as created_by_name
      FROM evidence_items_v2 e
      LEFT JOIN item_types t ON e.item_type_id = t.id
      LEFT JOIN locations l ON e.current_location_id = l.id
      LEFT JOIN analysts a ON e.current_custodian_id = a.id
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.created_at DESC
    `;
    
    // Apply filters in JavaScript
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.case_number?.toLowerCase().includes(searchLower) ||
        item.item_number?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.serial_number?.toLowerCase().includes(searchLower) ||
        item.make_model?.toLowerCase().includes(searchLower)
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

    return NextResponse.json({ items });
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
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Insert evidence item
    const result = await sql`
      INSERT INTO evidence_items_v2 (
        case_number, item_number, item_type_id, description,
        collected_date, collected_by, collection_location,
        current_status, current_location_id, current_custodian_id,
        extended_details, barcode, serial_number, make_model,
        condition_notes, created_by
      ) VALUES (
        ${data.case_number},
        ${data.item_number},
        ${data.item_type_id || null},
        ${data.description},
        ${data.collected_date},
        ${data.collected_by},
        ${data.collection_location || null},
        ${data.current_status || 'stored'},
        ${data.current_location_id || null},
        ${data.current_custodian_id || null},
        ${data.extended_details ? JSON.stringify(data.extended_details) : null}::jsonb,
        ${data.barcode || null},
        ${data.serial_number || null},
        ${data.make_model || null},
        ${data.condition_notes || null},
        ${user.userId}
      )
      RETURNING id
    `;

    const newId = result[0].id;
    
    // Create initial custody transfer record
    const receiptReason = await sql`SELECT id FROM transfer_reasons WHERE reason = 'Initial Receipt' LIMIT 1`;
    
    if (receiptReason.length > 0 && data.current_custodian_id) {
      const receiptNumber = `RCP-${newId}-${Date.now()}`;
      
      await sql`
        INSERT INTO custody_transfers (
          evidence_item_id, transfer_type, transfer_reason_id,
          to_party_type, to_party_id, to_location_id,
          transfer_date, condition_on_transfer, receipt_number,
          created_by
        ) VALUES (
          ${newId},
          'receipt',
          ${receiptReason[0].id},
          'analyst',
          ${data.current_custodian_id},
          ${data.current_location_id || null},
          NOW(),
          ${data.condition_notes || 'Initial receipt'},
          ${receiptNumber},
          ${user.userId}
        )
      `;
    }

    // Log the action
    await sql`
      INSERT INTO audit_log (user_id, action, table_name, record_id, details)
      VALUES (
        ${user.userId},
        'CREATE',
        'evidence_items_v2',
        ${newId},
        ${JSON.stringify({ case_number: data.case_number, item_number: data.item_number })}
      )
    `;

    return NextResponse.json({ success: true, id: newId });
  } catch (error: any) {
    console.error('Failed to create evidence item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
