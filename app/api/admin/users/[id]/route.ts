import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PATCH update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);
    const updates = await request.json();
    
    const sql = getDb();
    
    // Handle password hash if password provided
    let passwordHash = null;
    if (updates.password) {
      passwordHash = await bcrypt.hash(updates.password, 10);
    }
    
    // Update with all fields (some may be undefined which is fine)
    const result = await sql`
      UPDATE users 
      SET 
        full_name = COALESCE(${updates.full_name}, full_name),
        email = COALESCE(${updates.email}, email),
        role = COALESCE(${updates.role}, role),
        is_active = COALESCE(${updates.is_active}, is_active),
        password_hash = COALESCE(${passwordHash}, password_hash)
      WHERE id = ${userId}
      RETURNING id, username, full_name, email, role, is_active
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user: result[0] });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    // Prevent self-deletion
    if (userId === user.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    const sql = getDb();
    
    await sql`DELETE FROM users WHERE id = ${userId}`;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
