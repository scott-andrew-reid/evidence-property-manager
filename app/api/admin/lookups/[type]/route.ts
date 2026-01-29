import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// POST create new lookup item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type } = await params;
    const data = await request.json();
    const sql = getDb();
    
    let result;
    
    switch (type) {
      case 'item-types':
        if (!data.name) {
          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        result = await sql`
          INSERT INTO item_types (name, category)
          VALUES (${data.name}, ${data.category || null})
          RETURNING *
        `;
        break;
        
      case 'locations':
        if (!data.name) {
          return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        result = await sql`
          INSERT INTO locations (name)
          VALUES (${data.name})
          RETURNING *
        `;
        break;
        
      case 'analysts':
        if (!data.analyst_id || !data.full_name) {
          return NextResponse.json({ error: 'Analyst ID and full name are required' }, { status: 400 });
        }
        result = await sql`
          INSERT INTO analysts (analyst_id, full_name, email)
          VALUES (${data.analyst_id}, ${data.full_name}, ${data.email || null})
          RETURNING *
        `;
        break;
        
      case 'transfer-reasons':
        if (!data.reason) {
          return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }
        result = await sql`
          INSERT INTO transfer_reasons (reason)
          VALUES (${data.reason})
          RETURNING *
        `;
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    
    return NextResponse.json({ item: result[0] });
  } catch (error: any) {
    console.error('Failed to create lookup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
