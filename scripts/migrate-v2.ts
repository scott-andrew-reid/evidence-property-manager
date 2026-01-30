#!/usr/bin/env tsx
// Phase 2 Migration Script
// Run with: npx tsx scripts/migrate-v2.ts

import { initializeV2Schema } from '../lib/db/schema'

async function main() {
  console.log('==================================')
  console.log('Evidence Property Manager')
  console.log('Phase 2 Database Migration')
  console.log('==================================\n')
  
  try {
    await initializeV2Schema()
    console.log('\n✅ Migration completed successfully!')
    console.log('\nNew tables created:')
    console.log('  - item_types')
    console.log('  - locations')
    console.log('  - transfer_reasons')
    console.log('  - evidence_items_v2')
    console.log('  - custody_transfers')
    console.log('  - signatures')
    console.log('  - evidence_notes')
    console.log('  - evidence_photos')
    console.log('\nSeed data inserted:')
    console.log('  - 7 default item types')
    console.log('  - 5 default locations')
    console.log('  - 8 default transfer reasons')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
