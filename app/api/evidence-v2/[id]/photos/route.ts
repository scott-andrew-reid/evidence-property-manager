import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET photos for an evidence item
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
    
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS evidence_photos (
        id SERIAL PRIMARY KEY,
        evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id) ON DELETE CASCADE,
        photo_data TEXT NOT NULL,
        caption TEXT,
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    const photos = await sql`
      SELECT 
        p.id,
        p.photo_data,
        p.caption,
        p.uploaded_at,
        u.full_name as uploaded_by_name
      FROM evidence_photos p
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE p.evidence_item_id = ${itemId}
      ORDER BY p.uploaded_at DESC
    `;
    
    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST upload photo
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
    const { photo_data, caption } = await request.json();
    
    if (!photo_data) {
      return NextResponse.json({ error: 'Photo data is required' }, { status: 400 });
    }
    
    // Validate base64 data URL
    if (!photo_data.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid photo format' }, { status: 400 });
    }
    
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS evidence_photos (
        id SERIAL PRIMARY KEY,
        evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id) ON DELETE CASCADE,
        photo_data TEXT NOT NULL,
        caption TEXT,
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    const result = await sql`
      INSERT INTO evidence_photos (evidence_item_id, photo_data, caption, uploaded_by)
      VALUES (${itemId}, ${photo_data}, ${caption || null}, ${user.userId})
      RETURNING *
    `;
    
    // Get uploader name
    const users = await sql`SELECT full_name FROM users WHERE id = ${user.userId}`;
    const userName = users[0]?.full_name || 'Unknown';
    
    const photo = {
      ...result[0],
      uploaded_by_name: userName
    };
    
    return NextResponse.json({ photo });
  } catch (error: any) {
    console.error('Failed to upload photo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE photo
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
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    
    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }
    
    await sql`DELETE FROM evidence_photos WHERE id = ${parseInt(photoId)}`;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete photo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
