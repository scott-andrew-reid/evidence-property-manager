#!/usr/bin/env tsx
// Run Phase 2 migration against production database
// This bypasses the API endpoint and runs directly

import { config } from 'dotenv'

// Try to load DATABASE_URL from various sources
config({ path: '.env.local' })
config({ path: '.env' })

// Allow passing DATABASE_URL as argument
if (process.argv[2]) {
  process.env.DATABASE_URL = process.argv[2]
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found.')
  console.log('\nPlease provide it as an argument:')
  console.log('npx tsx scripts/run-migration-prod.ts "postgresql://..."')
  console.log('\nOr set it in .env.local')
  process.exit(1)
}

console.log('🔌 Connecting to production database...')
console.log('📍 URL:', process.env.DATABASE_URL.substring(0, 30) + '...')

import { initializeV2Schema } from '../lib/db/schema'

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
