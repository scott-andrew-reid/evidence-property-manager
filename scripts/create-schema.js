#!/usr/bin/env node
/**
 * Create Enhanced Schema - Direct execution
 */

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function createSchema() {
  console.log('Creating enhanced schema...\n');
  
  try {
    // Create lookup tables
    console.log('1. Creating item_types...');
    await sql`
      CREATE TABLE IF NOT EXISTS item_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT,
        extended_fields JSONB,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('2. Creating locations...');
    await sql`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        location_type TEXT,
        address TEXT,
        contact_info TEXT,
        capacity INTEGER,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('3. Creating analysts...');
    await sql`
      CREATE TABLE IF NOT EXISTS analysts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        badge_number TEXT UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        department TEXT,
        role TEXT,
        signature_image TEXT,
        can_receive BOOLEAN DEFAULT true,
        can_issue BOOLEAN DEFAULT true,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('4. Creating transfer_reasons...');
    await sql`
      CREATE TABLE IF NOT EXISTS transfer_reasons (
        id SERIAL PRIMARY KEY,
        reason TEXT NOT NULL UNIQUE,
        reason_type TEXT,
        requires_approval BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('5. Creating evidence_items_v2...');
    await sql`
      CREATE TABLE IF NOT EXISTS evidence_items_v2 (
        id SERIAL PRIMARY KEY,
        case_number TEXT NOT NULL,
        item_number TEXT NOT NULL,
        item_type_id INTEGER REFERENCES item_types(id),
        description TEXT NOT NULL,
        collected_date TIMESTAMP NOT NULL,
        collected_by TEXT NOT NULL,
        collection_location TEXT,
        current_status TEXT DEFAULT 'stored',
        current_location_id INTEGER REFERENCES locations(id),
        current_custodian_id INTEGER REFERENCES analysts(id),
        extended_details JSONB,
        barcode TEXT UNIQUE,
        serial_number TEXT,
        make_model TEXT,
        condition_notes TEXT,
        images JSONB,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(case_number, item_number)
      )
    `;
    
    console.log('6. Creating custody_transfers...');
    await sql`
      CREATE TABLE IF NOT EXISTS custody_transfers (
        id SERIAL PRIMARY KEY,
        evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id) ON DELETE CASCADE,
        transfer_type TEXT NOT NULL,
        transfer_reason_id INTEGER REFERENCES transfer_reasons(id),
        reason_details TEXT,
        from_party_type TEXT,
        from_party_id INTEGER,
        from_party_name TEXT,
        from_party_signature TEXT,
        from_location_id INTEGER REFERENCES locations(id),
        to_party_type TEXT,
        to_party_id INTEGER,
        to_party_name TEXT,
        to_party_signature TEXT,
        to_location_id INTEGER REFERENCES locations(id),
        transfer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expected_return_date DATE,
        condition_on_transfer TEXT,
        notes TEXT,
        receipt_pdf_path TEXT,
        receipt_number TEXT UNIQUE,
        requires_approval BOOLEAN DEFAULT false,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        approval_notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('7. Creating signatures...');
    await sql`
      CREATE TABLE IF NOT EXISTS signatures (
        id SERIAL PRIMARY KEY,
        analyst_id INTEGER REFERENCES analysts(id),
        signature_type TEXT,
        signature_data TEXT,
        signature_image_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('8. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_case_number ON evidence_items_v2(case_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_item_number ON evidence_items_v2(item_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence_items_v2(current_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_location ON evidence_items_v2(current_location_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence_items_v2(item_type_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_custody_evidence ON custody_transfers(evidence_item_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_custody_from_party ON custody_transfers(from_party_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_custody_to_party ON custody_transfers(to_party_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_custody_date ON custody_transfers(transfer_date)`;
    
    console.log('9. Inserting sample item types...');
    const itemTypes = [
      ['Mobile Phone', 'Electronics', JSON.stringify({fields: ["IMEI", "Phone Number", "Carrier", "Passcode Status"]})],
      ['Hard Drive', 'Electronics', JSON.stringify({fields: ["Capacity", "Serial Number", "Encryption Status", "Interface Type"]})],
      ['USB Drive', 'Electronics', JSON.stringify({fields: ["Capacity", "Brand", "Serial Number"]})],
      ['Laptop', 'Electronics', JSON.stringify({fields: ["Make", "Model", "Serial Number", "RAM", "Storage"]})],
      ['Document', 'Paper', JSON.stringify({fields: ["Document Type", "Page Count", "Date of Document"]})],
      ['Firearm', 'Weapon', JSON.stringify({fields: ["Make", "Model", "Serial Number", "Caliber", "Condition"]})],
      ['Currency', 'Financial', JSON.stringify({fields: ["Amount", "Currency Type", "Denomination Breakdown"]})],
      ['Drug Evidence', 'Controlled Substance', JSON.stringify({fields: ["Substance Type", "Weight", "Field Test Result", "Packaging"]})],
      ['SIM Card', 'Electronics', JSON.stringify({fields: ["ICCID", "Carrier", "Phone Number"]})],
      ['Other', 'Miscellaneous', JSON.stringify({fields: []})]
    ];
    
    for (const [name, category, fields] of itemTypes) {
      try {
        await sql`INSERT INTO item_types (name, category, extended_fields) VALUES (${name}, ${category}, ${fields}::jsonb)`;
      } catch (e) {
        if (!e.message.includes('duplicate')) throw e;
      }
    }
    
    console.log('10. Inserting sample locations...');
    const locations = [
      ['Evidence Room A', 'Storage', 'Main Building, Ground Floor'],
      ['Evidence Room B', 'Storage', 'Main Building, Ground Floor'],
      ['Digital Forensics Lab', 'Lab', 'Tech Building, 2nd Floor'],
      ['Firearms Lab', 'Lab', 'Tech Building, 1st Floor'],
      ['Court Evidence Locker', 'Court', 'Courthouse, Basement'],
      ['Temporary Holding', 'Storage', 'Main Building, Room 101'],
      ['Secure Vault', 'Storage', 'Main Building, Sub-Basement'],
      ['External - Crime Scene', 'External', 'Variable']
    ];
    
    for (const [name, type, address] of locations) {
      try {
        await sql`INSERT INTO locations (name, location_type, address) VALUES (${name}, ${type}, ${address})`;
      } catch (e) {
        if (!e.message.includes('duplicate')) throw e;
      }
    }
    
    console.log('11. Inserting sample transfer reasons...');
    const reasons = [
      ['Initial Receipt', 'Receipt', false],
      ['Forensic Analysis', 'Transfer', false],
      ['Court Presentation', 'Transfer', true],
      ['Lab Testing', 'Transfer', false],
      ['Return to Owner', 'Return', true],
      ['Destruction Approved', 'Disposal', true],
      ['Transfer to Archive', 'Transfer', false],
      ['Secure Storage', 'Transfer', false],
      ['Case Closure', 'Return', true],
      ['External Agency Request', 'Transfer', true]
    ];
    
    for (const [reason, type, approval] of reasons) {
      try {
        await sql`INSERT INTO transfer_reasons (reason, reason_type, requires_approval) VALUES (${reason}, ${type}, ${approval})`;
      } catch (e) {
        if (!e.message.includes('duplicate')) throw e;
      }
    }
    
    console.log('12. Creating admin analyst...');
    try {
      await sql`
        INSERT INTO analysts (user_id, badge_number, full_name, email, department, role, can_receive, can_issue)
        VALUES (1, 'ADMIN001', 'System Administrator', 'admin@evidence.local', 'Administration', 'Evidence Officer', true, true)
      `;
    } catch (e) {
      if (!e.message.includes('duplicate')) throw e;
    }
    
    console.log('\n✅ Schema creation complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

createSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
