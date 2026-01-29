import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET all active item types
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const itemTypes = await sql`
      SELECT id, name, category, extended_fields, active
      FROM item_types
      WHERE active = true
      ORDER BY category, name
    `;

    return NextResponse.json({ itemTypes });
  } catch (error: any) {
    console.error('Failed to fetch item types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
