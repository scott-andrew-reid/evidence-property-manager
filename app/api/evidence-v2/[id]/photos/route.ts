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
    
    // Get photos
    const photos = await sql`
      SELECT 
        p.*,
        u.username as uploaded_by_name,
        u.full_name as uploaded_by_full_name
      FROM evidence_photos p
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE p.evidence_item_id = ${evidenceId}
      ORDER BY p.uploaded_at DESC
    `;
    
    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST add a photo to evidence item
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
    
    if (!data.photo_path || data.photo_path.trim() === '') {
      return NextResponse.json({ error: 'Photo path is required' }, { status: 400 });
    }
    
    // Verify evidence exists
    const evidence = await sql`
      SELECT id FROM evidence_items_v2 WHERE id = ${evidenceId} LIMIT 1
    `;
    
    if (evidence.length === 0) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }
    
    // Create photo record
    const result = await sql`
      INSERT INTO evidence_photos (
        evidence_item_id,
        photo_path,
        caption,
        uploaded_by
      ) VALUES (
        ${evidenceId},
        ${data.photo_path.trim()},
        ${data.caption || null},
        ${user.userId}
      )
      RETURNING id, uploaded_at
    `;
    
    const photoId = result[0].id;
    const uploadedAt = result[0].uploaded_at;
    
    return NextResponse.json({ 
      success: true,
      id: photoId,
      uploaded_at: uploadedAt,
      message: 'Photo added successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create photo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
