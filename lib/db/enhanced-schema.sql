-- Enhanced Evidence Property Manager Database Schema
-- Comprehensive chain of custody tracking system

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- Item Types (e.g., Mobile Phone, Hard Drive, USB Drive, Document, etc.)
CREATE TABLE IF NOT EXISTS item_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- Electronics, Documents, Weapons, Drugs, etc.
  extended_fields JSONB, -- Type-specific field definitions
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations (e.g., Evidence Room A, Lab 1, Court, etc.)
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location_type TEXT, -- Storage, Lab, Court, External, etc.
  address TEXT,
  contact_info TEXT,
  capacity INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysts/Staff who can handle evidence
CREATE TABLE IF NOT EXISTS analysts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id), -- Links to auth system
  badge_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  role TEXT, -- Evidence Officer, Analyst, Detective, etc.
  signature_image TEXT, -- Path to signature image
  can_receive BOOLEAN DEFAULT true,
  can_issue BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfer Reasons (e.g., Analysis, Court, Storage, Disposal, etc.)
CREATE TABLE IF NOT EXISTS transfer_reasons (
  id SERIAL PRIMARY KEY,
  reason TEXT NOT NULL UNIQUE,
  reason_type TEXT, -- Receipt, Transfer, Return, Disposal
  requires_approval BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Enhanced Evidence Items
CREATE TABLE IF NOT EXISTS evidence_items_v2 (
  id SERIAL PRIMARY KEY,
  
  -- Basic Information
  case_number TEXT NOT NULL,
  item_number TEXT NOT NULL,
  item_type_id INTEGER REFERENCES item_types(id),
  description TEXT NOT NULL,
  
  -- Collection Details
  collected_date TIMESTAMP NOT NULL,
  collected_by TEXT NOT NULL,
  collection_location TEXT,
  
  -- Current Status
  current_status TEXT DEFAULT 'stored', -- stored, in_analysis, in_court, disposed, destroyed
  current_location_id INTEGER REFERENCES locations(id),
  current_custodian_id INTEGER REFERENCES analysts(id),
  
  -- Extended Details (type-specific, stored as JSON)
  extended_details JSONB,
  
  -- Metadata
  barcode TEXT UNIQUE,
  serial_number TEXT,
  make_model TEXT,
  condition_notes TEXT,
  images JSONB, -- Array of image paths
  
  -- Audit
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      coalesce(case_number, '') || ' ' ||
      coalesce(item_number, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(serial_number, '') || ' ' ||
      coalesce(make_model, '')
    )
  ) STORED,
  
  UNIQUE(case_number, item_number)
);

-- Chain of Custody Transfers
CREATE TABLE IF NOT EXISTS custody_transfers (
  id SERIAL PRIMARY KEY,
  
  -- Item Reference
  evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id) ON DELETE CASCADE,
  
  -- Transfer Type
  transfer_type TEXT NOT NULL, -- receipt, internal_transfer, return, disposal
  transfer_reason_id INTEGER REFERENCES transfer_reasons(id),
  reason_details TEXT,
  
  -- Parties Involved
  from_party_type TEXT, -- analyst, external, storage
  from_party_id INTEGER, -- References analysts(id) if type=analyst
  from_party_name TEXT, -- Custom name if external
  from_party_signature TEXT, -- Signature image path
  from_location_id INTEGER REFERENCES locations(id),
  
  to_party_type TEXT, -- analyst, external, storage
  to_party_id INTEGER, -- References analysts(id) if type=analyst
  to_party_name TEXT, -- Custom name if external
  to_party_signature TEXT, -- Signature image path
  to_location_id INTEGER REFERENCES locations(id),
  
  -- Transfer Details
  transfer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return_date DATE,
  condition_on_transfer TEXT,
  notes TEXT,
  
  -- Receipt/Documentation
  receipt_pdf_path TEXT, -- Path to generated PDF receipt
  receipt_number TEXT UNIQUE,
  
  -- Approval (if required)
  requires_approval BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  approval_notes TEXT,
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signatures (for custody transfers)
CREATE TABLE IF NOT EXISTS signatures (
  id SERIAL PRIMARY KEY,
  analyst_id INTEGER REFERENCES analysts(id),
  signature_type TEXT, -- drawn, uploaded, font
  signature_data TEXT, -- Base64 image data or font name
  signature_image_path TEXT, -- Saved image path
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_evidence_case_number ON evidence_items_v2(case_number);
CREATE INDEX IF NOT EXISTS idx_evidence_item_number ON evidence_items_v2(item_number);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence_items_v2(current_status);
CREATE INDEX IF NOT EXISTS idx_evidence_location ON evidence_items_v2(current_location_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence_items_v2(item_type_id);
CREATE INDEX IF NOT EXISTS idx_evidence_search ON evidence_items_v2 USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_custody_evidence ON custody_transfers(evidence_item_id);
CREATE INDEX IF NOT EXISTS idx_custody_from_party ON custody_transfers(from_party_id);
CREATE INDEX IF NOT EXISTS idx_custody_to_party ON custody_transfers(to_party_id);
CREATE INDEX IF NOT EXISTS idx_custody_date ON custody_transfers(transfer_date);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Sample Item Types
INSERT INTO item_types (name, category, extended_fields) VALUES
  ('Mobile Phone', 'Electronics', '{"fields": ["IMEI", "Phone Number", "Carrier", "Passcode Status"]}'),
  ('Hard Drive', 'Electronics', '{"fields": ["Capacity", "Serial Number", "Encryption Status", "Interface Type"]}'),
  ('USB Drive', 'Electronics', '{"fields": ["Capacity", "Brand", "Serial Number"]}'),
  ('Laptop', 'Electronics', '{"fields": ["Make", "Model", "Serial Number", "RAM", "Storage"]}'),
  ('Document', 'Paper', '{"fields": ["Document Type", "Page Count", "Date of Document"]}'),
  ('Firearm', 'Weapon', '{"fields": ["Make", "Model", "Serial Number", "Caliber", "Condition"]}'),
  ('Currency', 'Financial', '{"fields": ["Amount", "Currency Type", "Denomination Breakdown"]}'),
  ('Drug Evidence', 'Controlled Substance', '{"fields": ["Substance Type", "Weight", "Field Test Result", "Packaging"]}'),
  ('SIM Card', 'Electronics', '{"fields": ["ICCID", "Carrier", "Phone Number"]}'),
  ('Other', 'Miscellaneous', '{"fields": []}')
ON CONFLICT (name) DO NOTHING;

-- Sample Locations
INSERT INTO locations (name, location_type, address) VALUES
  ('Evidence Room A', 'Storage', 'Main Building, Ground Floor'),
  ('Evidence Room B', 'Storage', 'Main Building, Ground Floor'),
  ('Digital Forensics Lab', 'Lab', 'Tech Building, 2nd Floor'),
  ('Firearms Lab', 'Lab', 'Tech Building, 1st Floor'),
  ('Court Evidence Locker', 'Court', 'Courthouse, Basement'),
  ('Temporary Holding', 'Storage', 'Main Building, Room 101'),
  ('Secure Vault', 'Storage', 'Main Building, Sub-Basement'),
  ('External - Crime Scene', 'External', 'Variable')
ON CONFLICT (name) DO NOTHING;

-- Sample Transfer Reasons
INSERT INTO transfer_reasons (reason, reason_type, requires_approval) VALUES
  ('Initial Receipt', 'Receipt', false),
  ('Forensic Analysis', 'Transfer', false),
  ('Court Presentation', 'Transfer', true),
  ('Lab Testing', 'Transfer', false),
  ('Return to Owner', 'Return', true),
  ('Destruction Approved', 'Disposal', true),
  ('Transfer to Archive', 'Transfer', false),
  ('Secure Storage', 'Transfer', false),
  ('Case Closure', 'Return', true),
  ('External Agency Request', 'Transfer', true)
ON CONFLICT (reason) DO NOTHING;

-- Sample Admin Analyst (linked to admin user)
INSERT INTO analysts (user_id, badge_number, full_name, email, department, role, can_receive, can_issue)
VALUES (1, 'ADMIN001', 'System Administrator', 'admin@evidence.local', 'Administration', 'Evidence Officer', true, true)
ON CONFLICT (badge_number) DO NOTHING;
