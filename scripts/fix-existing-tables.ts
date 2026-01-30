import { getDb } from '../lib/db/schema'

async function main() {
  console.log('\n🔧 Fixing existing Phase 2 tables...\n')
  
  const sql = getDb()
  
  try {
    // Fix locations table
    console.log('Fixing locations table...')
    await sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS building TEXT`
    await sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS room TEXT`
    await sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS capacity INTEGER`
    await sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0`
    await sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS notes TEXT`
    await sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`
    console.log('✓ locations fixed')
    
    // Fix custody_transfers table
    console.log('Fixing custody_transfers table...')
    await sql`ALTER TABLE custody_transfers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`
    await sql`ALTER TABLE custody_transfers ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id)`
    await sql`ALTER TABLE custody_transfers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`
    await sql`ALTER TABLE custody_transfers ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE`
    await sql`ALTER TABLE custody_transfers ADD COLUMN IF NOT EXISTS receipt_pdf_path TEXT`
    console.log('✓ custody_transfers fixed')
    
    // Create missing indexes
    console.log('\nCreating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_case ON evidence_items_v2(case_number)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_item ON evidence_items_v2(item_number)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_status ON evidence_items_v2(current_status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_type ON evidence_items_v2(item_type_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_location ON evidence_items_v2(current_location_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_v2_custodian ON evidence_items_v2(current_custodian_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transfers_evidence ON custody_transfers(evidence_item_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transfers_status ON custody_transfers(status)`
    console.log('✓ Indexes created')
    
    // Seed default data
    console.log('\nSeeding default data...')
    
    // Item types
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
    
    // Locations
    await sql`
      INSERT INTO locations (name, building, room, capacity) VALUES
        ('Evidence Room A', 'Main Building', '101', 100),
        ('Evidence Room B', 'Main Building', '102', 100),
        ('Forensic Lab', 'Lab Building', 'L-1', 50),
        ('Court Evidence Locker', 'Courthouse', 'EL-1', 30),
        ('Secure Storage', 'Vault', 'V-1', 200)
      ON CONFLICT (name) DO NOTHING
    `
    
    // Transfer reasons
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
    
    console.log('✓ Seed data inserted')
    
    // Verify counts
    const itemTypes = await sql`SELECT COUNT(*) as count FROM item_types`
    const locations = await sql`SELECT COUNT(*) as count FROM locations`
    const reasons = await sql`SELECT COUNT(*) as count FROM transfer_reasons`
    
    console.log('\n✅ Migration complete!\n')
    console.log('📊 Database status:')
    console.log(`  • item_types: ${itemTypes[0].count} entries`)
    console.log(`  • locations: ${locations[0].count} entries`)
    console.log(`  • transfer_reasons: ${reasons[0].count} entries`)
    console.log('  • All Phase 2 tables ready!')
    console.log('\n🎉 Phase 2 backend is ready!\n')
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error)
    process.exit(1)
  }
}

main()
