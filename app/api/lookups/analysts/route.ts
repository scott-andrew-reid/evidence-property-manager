import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all active users (analysts)
// Note: Using users table instead of separate analysts table
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const analysts = await sql`
      SELECT 
        id, 
        username as badge_number, 
        full_name, 
        email, 
        role,
        COALESCE(is_active, true) as active
      FROM users
      WHERE COALESCE(is_active, true) = true
      ORDER BY full_name
    `;

    return NextResponse.json({ analysts });
  } catch (error: any) {
    console.error('Failed to fetch analysts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
