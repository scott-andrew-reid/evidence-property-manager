import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET chain of custody history for an evidence item
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
    
    const history = await sql`
      SELECT 
        t.id,
        t.receipt_number,
        t.transfer_date,
        t.transfer_type,
        t.transfer_reason,
        t.from_party_type,
        t.from_party_name,
        t.from_location_name,
        t.to_party_type,
        t.to_party_name,
        t.to_location_name,
        t.notes,
        t.from_signature,
        t.to_signature,
        u.full_name as created_by_name
      FROM transfers_v2 t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.evidence_item_id = ${itemId}
      ORDER BY t.transfer_date DESC
    `;
    
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
