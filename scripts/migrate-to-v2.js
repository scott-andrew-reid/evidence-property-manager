#!/usr/bin/env node
/**
 * Migration Script: Evidence Property Manager v1 → v2
 * 
 * Migrates from basic schema to enhanced chain of custody system
 * Safe to run multiple times (idempotent)
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log('🚀 Starting Evidence Property Manager Migration v1 → v2\n');
  
  try {
    // Step 1: Read and execute enhanced schema
    console.log('📝 Step 1: Creating enhanced schema...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../lib/db/enhanced-schema.sql'),
      'utf-8'
    );
    
    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    console.log('✅ Enhanced schema created\n');
    
    // Step 2: Check if v1 data exists
    console.log('📊 Step 2: Checking for existing data...');
    const v1Count = await sql`SELECT COUNT(*) as count FROM evidence_items`;
    const v1Items = parseInt(v1Count[0].count);
    console.log(`   Found ${v1Items} items in v1 schema\n`);
    
    // Step 3: Migrate data if exists
    if (v1Items > 0) {
      console.log('🔄 Step 3: Migrating existing evidence items...');
      
      // Get "Other" item type
      const otherType = await sql`SELECT id FROM item_types WHERE name = 'Other' LIMIT 1`;
      const otherTypeId = otherType[0]?.id;
      
      // Get default location
      const defaultLoc = await sql`SELECT id FROM locations WHERE name = 'Evidence Room A' LIMIT 1`;
      const defaultLocId = defaultLoc[0]?.id;
      
      // Get admin analyst
      const adminAnalyst = await sql`SELECT id FROM analysts WHERE badge_number = 'ADMIN001' LIMIT 1`;
      const adminAnalystId = adminAnalyst[0]?.id;
      
      // Check if already migrated
      const v2Count = await sql`SELECT COUNT(*) as count FROM evidence_items_v2`;
      const v2Items = parseInt(v2Count[0].count);
      
      if (v2Items === 0) {
        // Migrate items
        await sql`
          INSERT INTO evidence_items_v2 (
            case_number,
            item_number,
            item_type_id,
            description,
            collected_date,
            collected_by,
            collection_location,
            current_status,
            current_location_id,
            current_custodian_id,
            condition_notes,
            created_by,
            created_at,
            updated_at
          )
          SELECT 
            case_number,
            item_number,
            ${otherTypeId},
            description,
            collected_date::timestamp,
            collected_by,
            location,
            status,
            ${defaultLocId},
            ${adminAnalystId},
            notes,
            created_by,
            created_at,
            updated_at
          FROM evidence_items
        `;
        console.log(`   ✅ Migrated ${v1Items} items to v2 schema\n`);
        
        // Create initial custody records
        console.log('📋 Step 4: Creating initial custody records...');
        await sql`
          INSERT INTO custody_transfers (
            evidence_item_id,
            transfer_type,
            transfer_reason_id,
            to_party_type,
            to_party_id,
            to_location_id,
            transfer_date,
            condition_on_transfer,
            notes,
            receipt_number,
            created_by
          )
          SELECT 
            ev2.id,
            'receipt',
            (SELECT id FROM transfer_reasons WHERE reason = 'Initial Receipt' LIMIT 1),
            'analyst',
            ${adminAnalystId},
            ${defaultLocId},
            ev2.created_at,
            'Migrated from v1',
            'Initial custody record created during migration',
            'MIGR-' || ev2.id,
            ev2.created_by
          FROM evidence_items_v2 ev2
          WHERE NOT EXISTS (
            SELECT 1 FROM custody_transfers ct 
            WHERE ct.evidence_item_id = ev2.id
          )
        `;
        console.log(`   ✅ Created initial custody records\n`);
      } else {
        console.log(`   ℹ️  Migration already completed (${v2Items} items in v2)\n`);
      }
    } else {
      console.log('ℹ️  No data to migrate (clean install)\n');
    }
    
    // Step 5: Verify migration
    console.log('✅ Step 5: Verifying migration...');
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    console.log('   Tables:', tables.map(t => t.tablename).join(', '));
    
    const v2Final = await sql`SELECT COUNT(*) as count FROM evidence_items_v2`;
    const custodyCount = await sql`SELECT COUNT(*) as count FROM custody_transfers`;
    console.log(`   Evidence items: ${v2Final[0].count}`);
    console.log(`   Custody records: ${custodyCount[0].count}`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Verify data in evidence_items_v2');
    console.log('  2. Deploy updated application');
    console.log('  3. Test chain of custody features');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
