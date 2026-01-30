import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all transfer reasons
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    
    const reasons = await sql`
      SELECT id, reason, requires_approval, approval_role, created_at
      FROM transfer_reasons
      ORDER BY reason
    `;

    return NextResponse.json({ reasons });
  } catch (error: any) {
    console.error('Failed to fetch transfer reasons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new transfer reason
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reason, requires_approval, approval_role } = await request.json();
    
    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Check for duplicates
    const existing = await sql`
      SELECT id FROM transfer_reasons WHERE LOWER(reason) = LOWER(${reason})
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Transfer reason already exists' }, { status: 400 });
    }
    
    const result = await sql`
      INSERT INTO transfer_reasons (reason, requires_approval, approval_role)
      VALUES (
        ${reason}, 
        ${requires_approval || false},
        ${approval_role || null}
      )
      RETURNING id, reason, requires_approval, approval_role, created_at
    `;
    
    return NextResponse.json({ transferReason: result[0] });
  } catch (error: any) {
    console.error('Failed to create transfer reason:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
