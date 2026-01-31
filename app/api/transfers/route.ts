import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET custody transfers with filters
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    
    const evidenceId = searchParams.get('evidence_id');
    const status = searchParams.get('status');
    const transferType = searchParams.get('transfer_type');
    const custodianId = searchParams.get('custodian_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let transfers = await sql`
      SELECT 
        ct.*,
        tr.reason as transfer_reason,
        tr.requires_approval as reason_requires_approval,
        e.case_number,
        e.item_number,
        e.description as evidence_description,
        u1.username as from_custodian_name,
        u1.full_name as from_custodian_full_name,
        u2.username as to_custodian_name,
        u2.full_name as to_custodian_full_name,
        l1.name as from_location_name,
        l2.name as to_location_name,
        u3.username as initiated_by_name,
        u3.full_name as initiated_by_full_name,
        u4.username as approved_by_name,
        u4.full_name as approved_by_full_name
      FROM custody_transfers ct
      LEFT JOIN transfer_reasons tr ON ct.transfer_reason_id = tr.id
      LEFT JOIN evidence_items_v2 e ON ct.evidence_item_id = e.id
      LEFT JOIN users u1 ON ct.from_custodian_id = u1.id
      LEFT JOIN users u2 ON ct.to_custodian_id = u2.id
      LEFT JOIN locations l1 ON ct.from_location_id = l1.id
      LEFT JOIN locations l2 ON ct.to_location_id = l2.id
      LEFT JOIN users u3 ON ct.initiated_by = u3.id
      LEFT JOIN users u4 ON ct.approved_by = u4.id
      ORDER BY ct.initiated_at DESC
    `;
    
    // Apply filters
    if (evidenceId) {
      transfers = transfers.filter(t => t.evidence_item_id === parseInt(evidenceId));
    }
    
    if (status) {
      transfers = transfers.filter(t => t.status === status);
    }
    
    if (transferType) {
      transfers = transfers.filter(t => t.transfer_type === transferType);
    }
    
    if (custodianId) {
      const custId = parseInt(custodianId);
      transfers = transfers.filter(t => 
        t.from_custodian_id === custId || t.to_custodian_id === custId
      );
    }
    
    const total = transfers.length;
    transfers = transfers.slice(offset, offset + limit);
    
    return NextResponse.json({ 
      transfers,
      total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Failed to fetch transfers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new custody transfer
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const sql = getDb();
    
    // Validate required fields
    if (!data.evidence_item_id || !data.transfer_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: evidence_item_id, transfer_type' 
      }, { status: 400 });
    }
    
    // Validate evidence item exists
    const evidence = await sql`
      SELECT 
        id, 
        current_custodian_id, 
        current_location_id,
        current_status,
        case_number,
        item_number
      FROM evidence_items_v2 
      WHERE id = ${data.evidence_item_id} 
      LIMIT 1
    `;
    
    if (evidence.length === 0) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }
    
    const item = evidence[0];
    
    // Business rule: Can't transfer disposed/destroyed items
    if (item.current_status === 'disposed' || item.current_status === 'destroyed') {
      return NextResponse.json({ 
        error: `Cannot transfer evidence with status: ${item.current_status}` 
      }, { status: 400 });
    }
    
    // Validate transfer type
    const validTypes = ['receipt', 'internal', 'release', 'disposal'];
    if (!validTypes.includes(data.transfer_type)) {
      return NextResponse.json({ 
        error: `Invalid transfer_type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate transfer reason
    let transferReasonId = data.transfer_reason_id;
    let requiresApproval = false;
    
    if (data.transfer_reason_id) {
      const reason = await sql`
        SELECT id, requires_approval 
        FROM transfer_reasons 
        WHERE id = ${data.transfer_reason_id} 
        LIMIT 1
      `;
      
      if (reason.length === 0) {
        return NextResponse.json({ error: 'Invalid transfer_reason_id' }, { status: 400 });
      }
      
      requiresApproval = reason[0].requires_approval;
    }
    
    // Validate custodian references
    if (data.to_custodian_id) {
      const custodian = await sql`
        SELECT id FROM users 
        WHERE id = ${data.to_custodian_id} AND is_active = true 
        LIMIT 1
      `;
      
      if (custodian.length === 0) {
        return NextResponse.json({ error: 'Invalid or inactive to_custodian_id' }, { status: 400 });
      }
    }
    
    // Validate location references
    if (data.to_location_id) {
      const location = await sql`
        SELECT id FROM locations 
        WHERE id = ${data.to_location_id} AND active = true 
        LIMIT 1
      `;
      
      if (location.length === 0) {
        return NextResponse.json({ error: 'Invalid or inactive to_location_id' }, { status: 400 });
      }
    }
    
    // Generate receipt number
    const timestamp = Date.now();
    const receiptNumber = `${data.transfer_type.toUpperCase()}-${String(data.evidence_item_id).padStart(6, '0')}-${timestamp}`;
    
    // Determine initial status
    const initialStatus = requiresApproval ? 'pending' : 'completed';
    
    // Create transfer record
    const result = await sql`
      INSERT INTO custody_transfers (
        evidence_item_id,
        transfer_type,
        transfer_reason_id,
        transfer_reason_text,
        from_custodian_id,
        from_location_id,
        to_custodian_id,
        to_location_id,
        from_signature_id,
        to_signature_id,
        condition_notes,
        transfer_notes,
        status,
        receipt_number,
        initiated_by,
        initiated_at,
        completed_at
      ) VALUES (
        ${data.evidence_item_id},
        ${data.transfer_type},
        ${transferReasonId || null},
        ${data.transfer_reason_text || null},
        ${item.current_custodian_id || null},
        ${item.current_location_id || null},
        ${data.to_custodian_id || null},
        ${data.to_location_id || null},
        ${data.from_signature_id || null},
        ${data.to_signature_id || null},
        ${data.condition_notes || null},
        ${data.transfer_notes || null},
        ${initialStatus},
        ${receiptNumber},
        ${user.userId},
        NOW(),
        ${initialStatus === 'completed' ? sql`NOW()` : null}
      )
      RETURNING id
    `;
    
    const transferId = result[0].id;
    
    // If transfer is completed immediately, update evidence item
    if (initialStatus === 'completed') {
      const updates: any = {
        updated_at: sql`NOW()`
      };
      
      if (data.to_custodian_id !== undefined) {
        updates.current_custodian_id = data.to_custodian_id;
      }
      
      if (data.to_location_id !== undefined) {
        updates.current_location_id = data.to_location_id;
      }
      
      // Update status based on transfer type
      if (data.transfer_type === 'release') {
        updates.current_status = 'released';
      } else if (data.transfer_type === 'disposal') {
        updates.current_status = 'disposed';
      }
      
      await sql`
        UPDATE evidence_items_v2 
        SET 
          current_custodian_id = ${data.to_custodian_id || item.current_custodian_id},
          current_location_id = ${data.to_location_id || item.current_location_id},
          current_status = ${updates.current_status || item.current_status},
          updated_at = NOW()
        WHERE id = ${data.evidence_item_id}
      `;
    }
    
    return NextResponse.json({ 
      success: true,
      id: transferId,
      receipt_number: receiptNumber,
      status: initialStatus,
      requires_approval: requiresApproval,
      message: requiresApproval 
        ? 'Transfer created and awaiting approval'
        : 'Transfer completed successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create transfer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
