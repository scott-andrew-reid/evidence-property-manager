import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { initializeV2Schema } from '@/lib/db/schema';

// POST run Phase 2 migration
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  
  // Only admins can run migrations
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
  }

  try {
    console.log('Starting Phase 2 migration...');
    await initializeV2Schema();
    
    return NextResponse.json({ 
      success: true,
      message: 'Phase 2 schema initialized successfully',
      tables: [
        'item_types',
        'locations',
        'transfer_reasons',
        'evidence_items_v2',
        'custody_transfers',
        'signatures',
        'evidence_notes',
        'evidence_photos'
      ]
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET migration status
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
  }

  return NextResponse.json({ 
    message: 'Phase 2 Migration Endpoint',
    instructions: 'POST to this endpoint to run the migration',
    warning: 'This will create Phase 2 tables and seed default data'
  });
}
