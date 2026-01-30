import { getDb } from '../lib/db/schema'

async function main() {
  console.log('\n🚀 Starting Phase 2 Migration (Safe Mode)...\n')
  
  const sql = getDb()
  
  try {
    // Check what tables exist
    const tables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log('📋 Existing tables:', tables.map(t => t.tablename).join(', '))
    
    // Item Types (no dependencies)
    console.log('\n✓ Creating item_types...')
    await sql`
      CREATE TABLE IF NOT EXISTS item_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT,
        extended_fields JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Locations (no dependencies)
    console.log('✓ Creating locations...')
    await sql`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        building TEXT,
        room TEXT,
        capacity INTEGER,
        current_count INTEGER DEFAULT 0,
        notes TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Transfer Reasons (no dependencies)
    console.log('✓ Creating transfer_reasons...')
    await sql`
      CREATE TABLE IF NOT EXISTS transfer_reasons (
        id SERIAL PRIMARY KEY,
        reason TEXT NOT NULL UNIQUE,
        requires_approval BOOLEAN DEFAULT false,
        approval_role TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Evidence Items v2 (depends on item_types, locations, users)
    console.log('✓ Creating evidence_items_v2...')
    await sql`
      CREATE TABLE IF NOT EXISTS evidence_items_v2 (
        id SERIAL PRIMARY KEY,
        case_number TEXT NOT NULL,
        item_number TEXT NOT NULL,
        description TEXT NOT NULL,
        item_type_id INTEGER REFERENCES item_types(id),
        extended_fields JSONB,
        collected_date DATE NOT NULL,
        collected_by TEXT NOT NULL,
        collection_location TEXT,
        current_status TEXT DEFAULT 'stored',
        current_location_id INTEGER REFERENCES locations(id),
        current_custodian_id INTEGER REFERENCES users(id),
        chain_of_custody TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(case_number, item_number)
      )
    `
    
    // Custody Transfers (depends on evidence_items_v2)
    console.log('✓ Creating custody_transfers...')
    await sql`
      CREATE TABLE IF NOT EXISTS custody_transfers (
        id SERIAL PRIMARY KEY,
        evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id),
        transfer_type TEXT NOT NULL,
        transfer_reason_id INTEGER REFERENCES transfer_reasons(id),
        transfer_reason_text TEXT,
        from_custodian_id INTEGER REFERENCES users(id),
        from_location_id INTEGER REFERENCES locations(id),
        to_custodian_id INTEGER REFERENCES users(id),
        to_location_id INTEGER REFERENCES locations(id),
        from_signature_id INTEGER,
        to_signature_id INTEGER,
        condition_notes TEXT,
        transfer_notes TEXT,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        receipt_number TEXT UNIQUE,
        receipt_pdf_path TEXT,
        initiated_by INTEGER NOT NULL REFERENCES users(id),
        initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `
    
    // Signatures (depends on users)
    console.log('✓ Creating signatures...')
    await sql`
      CREATE TABLE IF NOT EXISTS signatures (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        signature_type TEXT NOT NULL,
        signature_data TEXT NOT NULL,
        image_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Evidence Notes (depends on evidence_items_v2)
    console.log('✓ Creating evidence_notes...')
    await sql`
      CREATE TABLE IF NOT EXISTS evidence_notes (
        id SERIAL PRIMARY KEY,
        evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id),
        note TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Evidence Photos (depends on evidence_items_v2)
    console.log('✓ Creating evidence_photos...')
    await sql`
      CREATE TABLE IF NOT EXISTS evidence_photos (
        id SERIAL PRIMARY KEY,
        evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id),
        photo_path TEXT NOT NULL,
        caption TEXT,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Create indexes
    console.log('\n✓ Creating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_case ON evidence_items_v2(case_number)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_item ON evidence_items_v2(item_number)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_status ON evidence_items_v2(current_status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_type ON evidence_items_v2(item_type_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_location ON evidence_items_v2(current_location_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_custodian ON evidence_items_v2(current_custodian_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transfers_evidence ON custody_transfers(evidence_item_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transfers_status ON custody_transfers(status)`
    
    // Seed data
    console.log('\n✓ Seeding default data...')
    await sql`
      INSERT INTO item_types (name, category, extended_fields) VALUES
        ('Mobile Phone', 'Electronic Device', '{"fields": ["imei", "phone_number", "carrier", "passcode_status"]}'),
        ('Hard Drive', 'Storage Media', '{"fields": ["capacity", "serial_number", "encryption", "interface"]}'),
        ('USB Drive', 'Storage Media', '{"fields": ["capacity", "serial_number", "brand"]}'),
        ('Laptop', 'Electronic Device', '{"fields": ["make", "model", "serial_number", "os"]}'),
        ('Document', 'Paper', '{"fields": ["document_type", "page_count", "date"]}'),
        ('Firearm', 'Weapon', '{"fields": ["make", "model", "serial_number", "caliber"]}'),
        ('Other', 'Miscellaneous', '{}')
      ON CONFLICT (name) DO NOTHING
    `
    
    await sql`
      INSERT INTO locations (name, building, room, capacity) VALUES
        ('Evidence Room A', 'Main Building', '101', 100),
        ('Evidence Room B', 'Main Building', '102', 100),
        ('Forensic Lab', 'Lab Building', 'L-1', 50),
        ('Court Evidence Locker', 'Courthouse', 'EL-1', 30),
        ('Secure Storage', 'Vault', 'V-1', 200)
      ON CONFLICT (name) DO NOTHING
    `
    
    await sql`
      INSERT INTO transfer_reasons (reason, requires_approval) VALUES
        ('Initial Evidence Receipt', false),
        ('Forensic Analysis Required', false),
        ('Court Presentation', true),
        ('Return to Owner', true),
        ('Transfer Between Locations', false),
        ('Secure Storage', false),
        ('Disposal Authorization', true),
        ('Chain of Custody Correction', true)
      ON CONFLICT (reason) DO NOTHING
    `
    
    console.log('\n✅ Migration complete!\n')
    console.log('📊 Phase 2 tables created:')
    console.log('  • item_types (7 seeded)')
    console.log('  • locations (5 seeded)')
    console.log('  • transfer_reasons (8 seeded)')
    console.log('  • evidence_items_v2')
    console.log('  • custody_transfers')
    console.log('  • signatures')
    console.log('  • evidence_notes')
    console.log('  • evidence_photos')
    console.log('\n🎉 Phase 2 backend is ready!\n')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
