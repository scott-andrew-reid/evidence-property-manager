#!/usr/bin/env tsx
// Run Phase 2 migration against production database
// Usage: DATABASE_URL="postgresql://..." npx tsx scripts/run-migration-prod.ts

import { initializeV2Schema } from '../lib/db/schema'

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found.')
  console.log('\nPlease set it as an environment variable:')
  console.log('DATABASE_URL="postgresql://..." npx tsx scripts/run-migration-prod.ts')
  process.exit(1)
}

console.log('🔌 Connecting to production database...')
console.log('📍 URL:', process.env.DATABASE_URL.substring(0, 30) + '...')

async function main() {
  console.log('\n==================================')
  console.log('Evidence Property Manager')
  console.log('Phase 2 Production Migration')
  console.log('==================================\n')
  
  try {
    await initializeV2Schema()
    console.log('\n✅ Production migration completed successfully!')
    console.log('\n📊 Database now has:')
    console.log('  ✓ item_types (7 seeded)')
    console.log('  ✓ locations (5 seeded)')
    console.log('  ✓ transfer_reasons (8 seeded)')
    console.log('  ✓ evidence_items_v2')
    console.log('  ✓ custody_transfers')
    console.log('  ✓ signatures')
    console.log('  ✓ evidence_notes')
    console.log('  ✓ evidence_photos')
    console.log('\n🎉 Phase 2 backend is ready!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
