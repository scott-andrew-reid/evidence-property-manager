import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET single transfer
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
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return NextResponse.json({ error: 'Invalid transfer ID' }, { status: 400 });
    }
    
    const transfers = await sql`
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
        u4.full_name as approved_by_full_name,
        s1.signature_data as from_signature_data,
        s2.signature_data as to_signature_data
      FROM custody_transfers ct
      LEFT JOIN transfer_reasons tr ON ct.transfer_reason_id = tr.id
      LEFT JOIN evidence_items_v2 e ON ct.evidence_item_id = e.id
      LEFT JOIN users u1 ON ct.from_custodian_id = u1.id
      LEFT JOIN users u2 ON ct.to_custodian_id = u2.id
      LEFT JOIN locations l1 ON ct.from_location_id = l1.id
      LEFT JOIN locations l2 ON ct.to_location_id = l2.id
      LEFT JOIN users u3 ON ct.initiated_by = u3.id
      LEFT JOIN users u4 ON ct.approved_by = u4.id
      LEFT JOIN signatures s1 ON ct.from_signature_id = s1.id
      LEFT JOIN signatures s2 ON ct.to_signature_id = s2.id
      WHERE ct.id = ${transferId}
      LIMIT 1
    `;
    
    if (transfers.length === 0) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    
    return NextResponse.json({ transfer: transfers[0] });
  } catch (error: any) {
    console.error('Failed to fetch transfer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update transfer (approve/reject/complete)
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
    const transferId = parseInt(id);
    const data = await request.json();
    
    if (isNaN(transferId)) {
      return NextResponse.json({ error: 'Invalid transfer ID' }, { status: 400 });
    }
    
    // Get current transfer
    const transfers = await sql`
      SELECT 
        ct.*,
        e.id as evidence_id,
        e.current_status as evidence_status
      FROM custody_transfers ct
      LEFT JOIN evidence_items_v2 e ON ct.evidence_item_id = e.id
      WHERE ct.id = ${transferId}
      LIMIT 1
    `;
    
    if (transfers.length === 0) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    
    const transfer = transfers[0];
    
    // Handle approval/rejection
    if (data.action === 'approve') {
      if (transfer.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Can only approve pending transfers' 
        }, { status: 400 });
      }
      
      // Update transfer to approved/completed
      await sql`
        UPDATE custody_transfers 
        SET 
          status = 'completed',
          approved_by = ${user.userId},
          approved_at = NOW(),
          completed_at = NOW()
        WHERE id = ${transferId}
      `;
      
      // Update evidence item
      const updates: any = {};
      
      if (transfer.to_custodian_id !== null) {
        updates.current_custodian_id = transfer.to_custodian_id;
      }
      
      if (transfer.to_location_id !== null) {
        updates.current_location_id = transfer.to_location_id;
      }
      
      // Update status based on transfer type
      if (transfer.transfer_type === 'release') {
        updates.current_status = 'released';
      } else if (transfer.transfer_type === 'disposal') {
        updates.current_status = 'disposed';
      }
      
      await sql`
        UPDATE evidence_items_v2 
        SET 
          current_custodian_id = ${transfer.to_custodian_id},
          current_location_id = ${transfer.to_location_id},
          current_status = ${updates.current_status || transfer.evidence_status},
          updated_at = NOW()
        WHERE id = ${transfer.evidence_item_id}
      `;
      
      return NextResponse.json({ 
        success: true,
        message: 'Transfer approved and completed'
      });
    }
    
    if (data.action === 'reject') {
      if (transfer.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Can only reject pending transfers' 
        }, { status: 400 });
      }
      
      await sql`
        UPDATE custody_transfers 
        SET 
          status = 'rejected',
          approved_by = ${user.userId},
          approved_at = NOW(),
          transfer_notes = COALESCE(transfer_notes || ' | ', '') || ${data.rejection_reason || 'Rejected by approver'}
        WHERE id = ${transferId}
      `;
      
      return NextResponse.json({ 
        success: true,
        message: 'Transfer rejected'
      });
    }
    
    // Handle signature updates
    if (data.from_signature_id !== undefined) {
      await sql`
        UPDATE custody_transfers 
        SET from_signature_id = ${data.from_signature_id}
        WHERE id = ${transferId}
      `;
    }
    
    if (data.to_signature_id !== undefined) {
      await sql`
        UPDATE custody_transfers 
        SET to_signature_id = ${data.to_signature_id}
        WHERE id = ${transferId}
      `;
    }
    
    // Handle general updates
    const updateFields: any = {};
    
    if (data.condition_notes !== undefined) {
      updateFields.condition_notes = data.condition_notes;
    }
    
    if (data.transfer_notes !== undefined) {
      updateFields.transfer_notes = data.transfer_notes;
    }
    
    if (data.receipt_pdf_path !== undefined) {
      updateFields.receipt_pdf_path = data.receipt_pdf_path;
    }
    
    if (Object.keys(updateFields).length > 0) {
      await sql`
        UPDATE custody_transfers 
        SET 
          condition_notes = COALESCE(${updateFields.condition_notes}, condition_notes),
          transfer_notes = COALESCE(${updateFields.transfer_notes}, transfer_notes),
          receipt_pdf_path = COALESCE(${updateFields.receipt_pdf_path}, receipt_pdf_path)
        WHERE id = ${transferId}
      `;
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Transfer updated successfully'
    });
  } catch (error: any) {
    console.error('Failed to update transfer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE transfer (only if pending/rejected)
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
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return NextResponse.json({ error: 'Invalid transfer ID' }, { status: 400 });
    }
    
    // Get transfer status
    const transfers = await sql`
      SELECT status 
      FROM custody_transfers 
      WHERE id = ${transferId}
      LIMIT 1
    `;
    
    if (transfers.length === 0) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    
    const status = transfers[0].status;
    
    // Only allow deletion of pending or rejected transfers
    if (status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot delete completed transfers (chain of custody integrity)' 
      }, { status: 409 });
    }
    
    await sql`DELETE FROM custody_transfers WHERE id = ${transferId}`;
    
    return NextResponse.json({ 
      success: true,
      message: 'Transfer deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete transfer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
