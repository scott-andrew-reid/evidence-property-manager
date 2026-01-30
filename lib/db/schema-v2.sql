-- Evidence Property Manager v2 Schema
-- Phase 2: Enhanced Tables for Chain of Custody

-- ====================
-- LOOKUP TABLES
-- ====================

-- Item Types (devices, documents, etc.)
CREATE TABLE IF NOT EXISTS item_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  extended_fields JSONB, -- Define extra fields for this type
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Physical Locations
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
);

-- Transfer Reasons
CREATE TABLE IF NOT EXISTS transfer_reasons (
  id SERIAL PRIMARY KEY,
  reason TEXT NOT NULL UNIQUE,
  requires_approval BOOLEAN DEFAULT false,
  approval_role TEXT, -- 'admin', 'supervisor', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- ENHANCED EVIDENCE TABLE
-- ====================

CREATE TABLE IF NOT EXISTS evidence_items_v2 (
  id SERIAL PRIMARY KEY,
  
  -- Basic Information
  case_number TEXT NOT NULL,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Type & Extended Fields
  item_type_id INTEGER REFERENCES item_types(id),
  extended_fields JSONB, -- Type-specific data (IMEI, serial, etc.)
  
  -- Collection Information
  collected_date DATE NOT NULL,
  collected_by TEXT NOT NULL,
  collection_location TEXT,
  
  -- Current Status
  current_status TEXT DEFAULT 'stored', -- stored, in_analysis, in_court, disposed, destroyed
  current_location_id INTEGER REFERENCES locations(id),
  current_custodian_id INTEGER REFERENCES users(id),
  
  -- Chain of Custody Notes
  chain_of_custody TEXT,
  notes TEXT,
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(case_number, item_number)
);

-- ====================
-- CUSTODY TRANSFERS
-- ====================

CREATE TABLE IF NOT EXISTS custody_transfers (
  id SERIAL PRIMARY KEY,
  
  -- Evidence Item
  evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id),
  
  -- Transfer Details
  transfer_type TEXT NOT NULL, -- 'initial_receipt', 'internal_transfer', 'return', 'disposal'
  transfer_reason_id INTEGER REFERENCES transfer_reasons(id),
  transfer_reason_text TEXT, -- Custom reason if not in lookup
  
  -- Parties
  from_custodian_id INTEGER REFERENCES users(id),
  from_location_id INTEGER REFERENCES locations(id),
  to_custodian_id INTEGER REFERENCES users(id),
  to_location_id INTEGER REFERENCES locations(id),
  
  -- Signatures
  from_signature_id INTEGER, -- Will reference signatures table
  to_signature_id INTEGER, -- Will reference signatures table
  
  -- Notes & Condition
  condition_notes TEXT,
  transfer_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, completed, rejected
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  
  -- PDF Receipt
  receipt_number TEXT UNIQUE,
  receipt_pdf_path TEXT,
  
  -- Metadata
  initiated_by INTEGER NOT NULL REFERENCES users(id),
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ====================
-- SIGNATURES
-- ====================

CREATE TABLE IF NOT EXISTS signatures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  signature_type TEXT NOT NULL, -- 'drawn', 'font', 'uploaded'
  signature_data TEXT NOT NULL, -- Base64 encoded image
  image_path TEXT, -- Path to saved image file
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- NOTES & PHOTOS
-- ====================

CREATE TABLE IF NOT EXISTS evidence_notes (
  id SERIAL PRIMARY KEY,
  evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id),
  note TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_photos (
  id SERIAL PRIMARY KEY,
  evidence_item_id INTEGER NOT NULL REFERENCES evidence_items_v2(id),
  photo_path TEXT NOT NULL,
  caption TEXT,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- INDEXES
-- ====================

CREATE INDEX IF NOT EXISTS idx_evidence_v2_case ON evidence_items_v2(case_number);
CREATE INDEX IF NOT EXISTS idx_evidence_v2_item ON evidence_items_v2(item_number);
CREATE INDEX IF NOT EXISTS idx_evidence_v2_status ON evidence_items_v2(current_status);
CREATE INDEX IF NOT EXISTS idx_evidence_v2_type ON evidence_items_v2(item_type_id);
CREATE INDEX IF NOT EXISTS idx_evidence_v2_location ON evidence_items_v2(current_location_id);
CREATE INDEX IF NOT EXISTS idx_evidence_v2_custodian ON evidence_items_v2(current_custodian_id);

CREATE INDEX IF NOT EXISTS idx_transfers_evidence ON custody_transfers(evidence_item_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON custody_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_from_custodian ON custody_transfers(from_custodian_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_custodian ON custody_transfers(to_custodian_id);

-- ====================
-- SEED DATA
-- ====================

-- Default Item Types
INSERT INTO item_types (name, category, extended_fields) VALUES
  ('Mobile Phone', 'Electronic Device', '{"fields": ["imei", "phone_number", "carrier", "passcode_status"]}'),
  ('Hard Drive', 'Storage Media', '{"fields": ["capacity", "serial_number", "encryption", "interface"]}'),
  ('USB Drive', 'Storage Media', '{"fields": ["capacity", "serial_number", "brand"]}'),
  ('Laptop', 'Electronic Device', '{"fields": ["make", "model", "serial_number", "os"]}'),
  ('Document', 'Paper', '{"fields": ["document_type", "page_count", "date"]}'),
  ('Firearm', 'Weapon', '{"fields": ["make", "model", "serial_number", "caliber"]}'),
  ('Other', 'Miscellaneous', '{}')
ON CONFLICT (name) DO NOTHING;

-- Default Locations
INSERT INTO locations (name, building, room, capacity) VALUES
  ('Evidence Room A', 'Main Building', '101', 100),
  ('Evidence Room B', 'Main Building', '102', 100),
  ('Forensic Lab', 'Lab Building', 'L-1', 50),
  ('Court Evidence Locker', 'Courthouse', 'EL-1', 30),
  ('Secure Storage', 'Vault', 'V-1', 200)
ON CONFLICT (name) DO NOTHING;

-- Default Transfer Reasons
INSERT INTO transfer_reasons (reason, requires_approval) VALUES
  ('Initial Evidence Receipt', false),
  ('Forensic Analysis Required', false),
  ('Court Presentation', true),
  ('Return to Owner', true),
  ('Transfer Between Locations', false),
  ('Secure Storage', false),
  ('Disposal Authorization', true),
  ('Chain of Custody Correction', true)
ON CONFLICT (reason) DO NOTHING;
