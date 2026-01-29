# Testing Guide

## Test Infrastructure

This project uses **Vitest** for unit and integration testing, along with React Testing Library for component tests.

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

Tests are located in the `__tests__/` directory, mirroring the application structure:

```
__tests__/
├── components/          # Component tests
├── lib/                 # Utility function tests
├── api/                 # API route tests
└── integration/         # End-to-end integration tests
```

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Utility Function Tests

```typescript
import { describe, it, expect } from 'vitest'
import { myUtilFunction } from '@/lib/utils'

describe('myUtilFunction', () => {
  it('should return expected result', () => {
    expect(myUtilFunction('input')).toBe('expected')
  })
})
```

### API Route Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/my-route/route'

describe('API: /api/my-route', () => {
  it('should return data', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
  })
})
```

## Mocking

### Environment Variables

```typescript
vi.mock('process', () => ({
  env: {
    DATABASE_URL: 'test-db-url',
    JWT_SECRET: 'test-secret',
  },
}))
```

### Database Calls

```typescript
vi.mock('@/lib/db/schema', () => ({
  getDb: () => mockSqlFunction,
}))
```

## CI/CD

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Before deployment to Vercel

See `.github/workflows/ci.yml` for the complete pipeline.

## Coverage Goals

- **Minimum**: 70% overall coverage
- **Target**: 80%+ for critical paths (auth, evidence CRUD, transfers)

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Arrange-Act-Assert pattern**
4. **Mock external dependencies**
5. **Keep tests fast and isolated**
6. **Test edge cases and error conditions**

## Current Test Status

✅ Utils: Basic utility function tests  
🚧 Components: In progress  
🚧 API Routes: In progress  
🚧 Integration: Planned  

---

**Need help?** Check the [Vitest docs](https://vitest.dev/) or [Testing Library docs](https://testing-library.com/).
