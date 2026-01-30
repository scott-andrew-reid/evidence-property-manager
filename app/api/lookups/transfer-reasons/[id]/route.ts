import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET single transfer reason
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
      SELECT id, reason, requires_approval, approval_role, created_at
      FROM transfer_reasons
      WHERE id = ${parseInt(id)}
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Transfer reason not found' }, { status: 404 });
    }
    
    return NextResponse.json({ transferReason: result[0] });
  } catch (error: any) {
    console.error('Failed to fetch transfer reason:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update transfer reason
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
    const { reason, requires_approval, approval_role } = await request.json();
    
    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Check for duplicate reasons (excluding current record)
    const existing = await sql`
      SELECT id FROM transfer_reasons 
      WHERE LOWER(reason) = LOWER(${reason})
      AND id != ${parseInt(id)}
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Transfer reason already exists' }, { status: 400 });
    }
    
    const result = await sql`
      UPDATE transfer_reasons
      SET reason = ${reason},
          requires_approval = ${requires_approval || false},
          approval_role = ${approval_role || null}
      WHERE id = ${parseInt(id)}
      RETURNING id, reason, requires_approval, approval_role, created_at
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Transfer reason not found' }, { status: 404 });
    }
    
    return NextResponse.json({ transferReason: result[0] });
  } catch (error: any) {
    console.error('Failed to update transfer reason:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE transfer reason
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
    
    // Check if transfer reason is in use
    const inUse = await sql`
      SELECT COUNT(*) as count
      FROM custody_transfers
      WHERE transfer_reason_id = ${parseInt(id)}
    `;
    
    if (parseInt(inUse[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete transfer reason that has been used in transfers' 
      }, { status: 400 });
    }
    
    const result = await sql`
      DELETE FROM transfer_reasons
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Transfer reason not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete transfer reason:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
