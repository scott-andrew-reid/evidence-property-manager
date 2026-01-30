import { initializeV2Schema } from '../lib/db/schema'

async function main() {
  console.log('\n🚀 Starting Phase 2 Migration...\n')
  await initializeV2Schema()
  console.log('\n✅ Migration complete!\n')
}

main().catch(err => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
