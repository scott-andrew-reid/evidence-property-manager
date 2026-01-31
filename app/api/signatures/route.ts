import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// GET signatures for a user or all
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('user_id');
    const signatureType = searchParams.get('signature_type');
    
    let signatures;
    
    if (userId) {
      signatures = await sql`
        SELECT 
          s.*,
          u.username,
          u.full_name
        FROM signatures s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ${parseInt(userId)}
        ORDER BY s.created_at DESC
      `;
    } else {
      signatures = await sql`
        SELECT 
          s.*,
          u.username,
          u.full_name
        FROM signatures s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
      `;
    }
    
    if (signatureType) {
      signatures = signatures.filter(s => s.signature_type === signatureType);
    }
    
    return NextResponse.json({ signatures });
  } catch (error: any) {
    console.error('Failed to fetch signatures:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new signature
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const sql = getDb();
    
    // Validate required fields
    if (!data.signature_type || !data.signature_data) {
      return NextResponse.json({ 
        error: 'Missing required fields: signature_type, signature_data' 
      }, { status: 400 });
    }
    
    // Validate signature type
    const validTypes = ['hand-drawn', 'typed', 'uploaded'];
    if (!validTypes.includes(data.signature_type)) {
      return NextResponse.json({ 
        error: `Invalid signature_type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }
    
    // Use provided user_id or current user
    const signatureUserId = data.user_id || user.userId;
    
    // Validate user exists
    const users = await sql`
      SELECT id FROM users WHERE id = ${signatureUserId} LIMIT 1
    `;
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }
    
    // Create signature
    const result = await sql`
      INSERT INTO signatures (
        user_id,
        signature_type,
        signature_data,
        image_path
      ) VALUES (
        ${signatureUserId},
        ${data.signature_type},
        ${data.signature_data},
        ${data.image_path || null}
      )
      RETURNING id
    `;
    
    const signatureId = result[0].id;
    
    return NextResponse.json({ 
      success: true,
      id: signatureId,
      message: 'Signature created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create signature:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
