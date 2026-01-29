import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// POST new note
export async function POST(
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
    const { text } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }
    
    // Create notes table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS evidence_notes (
        id SERIAL PRIMARY KEY,
        evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Insert note
    const result = await sql`
      INSERT INTO evidence_notes (evidence_item_id, text, created_by)
      VALUES (${itemId}, ${text.trim()}, ${user.userId})
      RETURNING *
    `;
    
    // Get user name
    const users = await sql`SELECT full_name FROM users WHERE id = ${user.userId}`;
    const userName = users[0]?.full_name || 'Unknown';
    
    const note = {
      ...result[0],
      created_by: userName
    };
    
    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('Failed to add note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
