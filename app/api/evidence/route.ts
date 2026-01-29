import { NextRequest, NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// Initialize database on first request
initializeDatabase();

// GET all evidence items
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = db.prepare(`
      SELECT e.*, u.full_name as created_by_name
      FROM evidence_items e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.created_at DESC
    `).all();

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
}

// POST new evidence item
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const result = db.prepare(`
      INSERT INTO evidence_items (
        case_number, item_number, description, collected_date,
        collected_by, location, chain_of_custody, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.case_number,
      data.item_number,
      data.description,
      data.collected_date,
      data.collected_by,
      data.location || null,
      data.chain_of_custody || null,
      data.status || 'stored',
      data.notes || null,
      user.userId
    );

    // Log the action
    db.prepare(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      user.userId,
      'CREATE',
      'evidence_items',
      result.lastInsertRowid,
      JSON.stringify({ case_number: data.case_number, item_number: data.item_number })
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create evidence item' }, { status: 500 });
  }
}
