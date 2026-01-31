import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET notes for an evidence item
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
    const evidenceId = parseInt(id);
    
    if (isNaN(evidenceId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
    }
    
    // Verify evidence exists
    const evidence = await sql`
      SELECT id FROM evidence_items_v2 WHERE id = ${evidenceId} LIMIT 1
    `;
    
    if (evidence.length === 0) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }
    
    // Get notes
    const notes = await sql`
      SELECT 
        n.*,
        u.username as created_by_name,
        u.full_name as created_by_full_name
      FROM evidence_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.evidence_item_id = ${evidenceId}
      ORDER BY n.created_at DESC
    `;
    
    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST add a note to evidence item
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
    const evidenceId = parseInt(id);
    const data = await request.json();
    
    if (isNaN(evidenceId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
    }
    
    if (!data.note || data.note.trim() === '') {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }
    
    // Verify evidence exists
    const evidence = await sql`
      SELECT id FROM evidence_items_v2 WHERE id = ${evidenceId} LIMIT 1
    `;
    
    if (evidence.length === 0) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }
    
    // Create note
    const result = await sql`
      INSERT INTO evidence_notes (
        evidence_item_id,
        note,
        created_by
      ) VALUES (
        ${evidenceId},
        ${data.note.trim()},
        ${user.userId}
      )
      RETURNING id, created_at
    `;
    
    const noteId = result[0].id;
    const createdAt = result[0].created_at;
    
    return NextResponse.json({ 
      success: true,
      id: noteId,
      created_at: createdAt,
      message: 'Note added successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
