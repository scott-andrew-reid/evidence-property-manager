import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all active analysts
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const analysts = await sql`
      SELECT 
        id, badge_number, full_name, email, department, role,
        can_receive, can_issue, active
      FROM analysts
      WHERE active = true
      ORDER BY full_name
    `;

    return NextResponse.json({ analysts });
  } catch (error: any) {
    console.error('Failed to fetch analysts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
