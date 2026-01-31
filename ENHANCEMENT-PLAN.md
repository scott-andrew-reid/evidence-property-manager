# Evidence Property Manager - Enhancement Plan

## Overview
Transform from basic CRUD app to comprehensive chain of custody evidence management system.

## Core Requirements

### 1. Modal Forms ✅ Priority
- Replace inline forms with modal dialogs
- Add Evidence modal
- Transfer Evidence modal
- Edit Evidence modal
- View Evidence Details modal

### 2. Enhanced Table Features
- **Search**: Full-text search across case, item, description
- **Filters**:
  - By Case Number
  - By Location
  - By Status
  - By Item Type
  - Date Range
  - Custodian
- **Sorting**: All columns
- **Pagination**: Handle large datasets

### 3. Data Model Enhancements

#### New Tables
- `item_types` - Lookup for device/evidence types
- `locations` - Physical locations
- `analysts` - Staff who can handle evidence
- `transfer_reasons` - Standard transfer reasons
- `custody_transfers` - Full chain of custody
- `signatures` - Digital signatures
- `evidence_items_v2` - Enhanced evidence table

#### Relationships
- Evidence → Item Type (lookup)
- Evidence → Current Location (lookup)
- Evidence → Current Custodian (analyst)
- Transfer → From/To Analyst
- Transfer → From/To Location
- Transfer → Reason

### 4. Chain of Custody Transfers

#### Transfer Types
1. **Initial Receipt** - Evidence enters system
2. **Internal Transfer** - Between analysts/locations
3. **Return** - Back to owner/origin
4. **Disposal** - Destruction/disposal

#### Transfer Workflow
1. Select evidence item
2. Choose transfer type & reason
3. Select/enter parties (from/to)
4. Capture signatures (both parties)
5. Add notes/condition
6. Generate PDF receipt
7. Update evidence status/location

#### Business Rules
- Can only transfer from current custodian
- Location changes must be valid
- Approvals required for certain transfers
- Both signatures required
- PDF receipt auto-generated

### 5. Signature Capture

#### Methods Supported
1. **Hand-drawn** - Canvas signature pad
2. **Font-based** - Generated from name
3. **Image upload** - Upload signature image

#### Storage
- Signatures stored as base64 + image files
- Linked to analysts for reuse
- Embedded in PDF receipts

### 6. PDF Receipt Generation

#### Contains
- Receipt number (unique)
- Evidence details (case, item, description)
- Transfer type & reason
- From/To parties with signatures
- Date/time
- Condition notes
- QR code for verification
- Official letterhead/branding

### 7. Item Detail View

#### Basic Details (Always Shown)
- Case Number
- Item Number
- Description
- Status
- Current Location
- Current Custodian
- Collected Date/By

#### Extended Details (Type-Specific)
Examples:
- **Mobile Phone**: IMEI, Phone #, Carrier, Passcode Status
- **Hard Drive**: Capacity, Serial, Encryption, Interface
- **Firearm**: Make, Model, Serial, Caliber
- **Document**: Type, Page Count, Date
- Stored as JSONB, rendered dynamically

#### History Tab
- Complete chain of custody
- All transfers with dates/parties
- PDF receipts downloadable

### 8. Lookups Management

Admin screens for:
- Item Types (with extended fields definition)
- Locations (with capacity tracking)
- Analysts (with permissions)
- Transfer Reasons (with approval requirements)

---

## Implementation Phases

### Phase 1: Database Migration ✅ COMPLETE (2026-01-30)
- [x] Create enhanced schema
- [x] Migration script from v1 → v2
- [x] Deploy to Neon
- [x] Seed sample data

### Phase 2: Backend API 🔄 IN PROGRESS (37.5% Complete)
- [x] Item Types CRUD API ✅
- [x] Locations CRUD API ✅
- [x] Transfer Reasons CRUD API ✅
- [ ] Evidence v2 CRUD API ← **NEXT**
- [ ] Custody Transfers API ← **AFTER**
- [ ] Signature Upload API
- [ ] PDF Generation API
- [ ] Search/Filter API

### Phase 3: UI Components
- [ ] Modal component library
- [ ] Signature capture component
- [ ] Table with search/filters
- [ ] Item detail view
- [ ] Transfer wizard
- [ ] PDF preview

### Phase 4: Features
- [ ] Add Evidence (modal)
- [ ] View Evidence (modal with tabs)
- [ ] Transfer Evidence (wizard)
- [ ] Search & Filter
- [ ] Chain of Custody Report
- [ ] PDF Receipt Generation

### Phase 5: Business Rules
- [ ] Transfer validation
- [ ] Approval workflows
- [ ] Location capacity checks
- [ ] Custody constraints
- [ ] Status transitions

### Phase 6: Admin Features
- [ ] Manage Item Types
- [ ] Manage Locations
- [ ] Manage Analysts
- [ ] Manage Transfer Reasons
- [ ] Audit Reports

---

## Technical Stack

### New Dependencies
```json
{
  "@react-pdf/renderer": "PDF generation",
  "react-signature-canvas": "Signature capture",
  "qrcode": "QR code generation",
  "react-modal": "Modal dialogs",
  "date-fns": "Date handling",
  "recharts": "Analytics/charts"
}
```

### Database
- PostgreSQL with JSONB for extended fields
- Full-text search with tsvector
- Proper indexing for performance

### File Storage
- Local: /public/uploads/{signatures,receipts}
- Production: Consider S3/Cloudflare R2

---

## Security Considerations

1. **Access Control**
   - Role-based permissions
   - Analysts can only transfer items they possess
   - Approvals for sensitive transfers

2. **Audit Trail**
   - Every action logged
   - Immutable custody records
   - Digital signatures legally binding

3. **Data Integrity**
   - Foreign key constraints
   - Transaction-based transfers
   - Validation at multiple layers

---

## Migration Strategy

### From v1 to v2
1. Create v2 tables alongside v1
2. Migrate existing evidence to v2
3. Create initial custody records for existing items
4. Switch application to use v2 tables
5. Archive/drop v1 tables

### Zero Downtime
- Deploy v2 schema first
- Run migration script
- Deploy new app version
- Verify data integrity
- Remove v1 tables

---

## Timeline Estimate

- Phase 1: Database - **2 hours**
- Phase 2: Backend API - **6 hours**
- Phase 3: UI Components - **8 hours**
- Phase 4: Features - **10 hours**
- Phase 5: Business Rules - **4 hours**
- Phase 6: Admin - **6 hours**

**Total**: ~36 hours of development

---

## Next Steps

1. Review and approve this plan
2. Deploy enhanced database schema
3. Start with Phase 2: Backend API
4. Iterative development and testing
5. Deploy to production

---

**This transforms the Evidence Property Manager into a production-grade forensic evidence management system with complete chain of custody tracking.**
