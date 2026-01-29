import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET all users
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    
    const users = await sql`
      SELECT id, username, full_name, email, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password, full_name, email, role } = await request.json();
    
    if (!username || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Check if username exists
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await sql`
      INSERT INTO users (username, password_hash, full_name, email, role)
      VALUES (${username}, ${passwordHash}, ${full_name}, ${email || null}, ${role || 'analyst'})
      RETURNING id, username, full_name, email, role, is_active, created_at
    `;
    
    return NextResponse.json({ user: result[0] });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
