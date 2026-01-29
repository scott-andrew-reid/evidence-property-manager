# Changelog

## [Unreleased] - 2026-01-29

### Fixed
- **Dark Mode**: Updated `globals.css` and `tailwind.config.ts` to properly support dark mode with correct CSS variable naming
- **Button Borders**: Fixed border visibility issues by using proper Tailwind v4 `@layer base` syntax
- **Users Table**: Added `email` and `is_active` columns to users table schema with migration support
- **User Creation**: Fixed "column 'email' does not exist" error when creating new users

### Added
- **Full-Page Evidence Details**: Created `/evidence/[id]` route with comprehensive detail view including:
  - Tabbed interface (Details, Chain of Custody, Photos)
  - All evidence metadata display
  - Extended fields support
  - Navigation back to dashboard
  - Responsive layout
- **UI Components**: 
  - `Badge` component for status indicators
  - `Tabs` component for tabbed interfaces
- **Testing Infrastructure**:
  - Vitest setup with React Testing Library
  - Sample utility tests
  - Test scripts in package.json
  - Testing guide documentation (TESTING.md)
- **CI/CD Pipeline**:
  - GitHub Actions workflow for automated testing
  - Lint, test, and build checks on push/PR
  - Automatic deployment to Vercel on main branch
- **Documentation**: 
  - TESTING.md - Complete testing guide
  - CHANGELOG.md - Project changelog

### Changed
- **Analysts API**: Updated `/api/lookups/analysts` to use `users` table instead of separate `analysts` table
  - Maps `username` to `badge_number`
  - Uses `is_active` for active status
  - Maintains backward compatibility with frontend

### Dependencies
- Added `@radix-ui/react-tabs` ^1.1.0
- Added `@testing-library/react` ^16.1.0
- Added `@testing-library/jest-dom` ^6.7.0
- Added `@vitejs/plugin-react` ^4.3.4
- Added `@vitest/ui` ^3.0.10
- Added `vitest` ^3.0.10
- Added `jsdom` ^25.0.1

### Technical Details

#### Database Schema Changes
```sql
-- Migration applied in lib/db/schema.ts
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

#### File Structure Changes
```
app/
├── evidence/
│   └── [id]/
│       └── page.tsx          # New: Full-page evidence detail view
components/ui/
├── badge.tsx                  # New: Badge component
└── tabs.tsx                   # New: Tabs component
__tests__/
└── utils.test.ts             # New: Sample tests
.github/
└── workflows/
    └── ci.yml                # New: CI/CD pipeline
vitest.config.ts              # New: Vitest configuration
vitest.setup.ts               # New: Test setup
TESTING.md                    # New: Testing documentation
CHANGELOG.md                  # New: This file
```

### Migration Notes

**For existing deployments:**
1. Database schema will auto-migrate on next request (adds email & is_active columns)
2. No data loss - all columns are nullable/defaulted
3. Existing users will have `is_active = true` by default

**For local development:**
1. Pull latest code
2. Run `npm install` to get new dependencies
3. Restart dev server - schema will auto-migrate
4. Run `npm test` to verify tests pass

### Breaking Changes
None - all changes are backward compatible.

### Next Steps
See ENHANCEMENT-PLAN.md for upcoming features:
- Phase 2: Backend API for lookups/transfers
- Phase 3: Modal forms
- Phase 4: Transfer workflow with signatures
- Phase 5: PDF receipt generation
- Phase 6: Admin features

---

**Deployed**: Not yet (awaiting testing)  
**Status**: ✅ All fixes implemented  
**Tests**: ✅ Basic infrastructure in place  
**CI/CD**: ✅ Pipeline configured
