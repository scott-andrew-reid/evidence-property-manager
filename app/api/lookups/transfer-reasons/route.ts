import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all active transfer reasons
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const transferType = searchParams.get('type'); // Filter by transfer type if provided
    
    let reasons;
    if (transferType) {
      reasons = await sql`
        SELECT id, reason, reason_type, requires_approval, active
        FROM transfer_reasons
        WHERE active = true AND reason_type = ${transferType}
        ORDER BY reason
      `;
    } else {
      reasons = await sql`
        SELECT id, reason, reason_type, requires_approval, active
        FROM transfer_reasons
        WHERE active = true
        ORDER BY reason_type, reason
      `;
    }

    return NextResponse.json({ reasons });
  } catch (error: any) {
    console.error('Failed to fetch transfer reasons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
