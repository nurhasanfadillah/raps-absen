# Testing

## Current State

**No testing infrastructure exists.**

- No test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`)
- No testing dependencies in `package.json`
- No test runner configured (no Jest, Vitest, Playwright, Cypress)
- No `test` script in `package.json` (only `dev`, `build`, `preview`)
- No CI/CD workflows (no GitHub Actions)

The project is at MVP stage — feature-complete but with zero automated coverage.

## Risk Areas Without Tests

These are the highest-risk untested paths:

| Area | Risk | File |
|---|---|---|
| Payroll calculation | Financial correctness — salary, overtime, deductions | `store.tsx:451-532` |
| Attendance classification | Half-day vs full-day logic (09:00 threshold) | `store.tsx:347-378`, `config.ts` |
| Cash advance lifecycle | Lock on payment/deduction, unlink on payroll delete | `store.tsx:381-447` |
| Login / credential hash | SHA-256 hashing, reset code verification | `store.tsx:214-278` |
| Payroll delete cascade | Reverts `isPaid` on linked cash advances | `store.tsx:571-594` |
| Employee soft-delete guard | Blocks hard-delete if linked transactions exist | `store.tsx:326-337` |

## Recommended Testing Setup

If adding tests, the recommended stack for this Vite + React + TypeScript project:

### Unit / Integration Tests
- **Runner**: Vitest (native Vite integration, same config)
- **Component tests**: React Testing Library
- **Install**:
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
  ```
- **Config**: Add to `vite.config.ts`:
  ```ts
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true
  }
  ```

### E2E Tests
- **Runner**: Playwright
- **Install**:
  ```bash
  npx playwright install
  ```

### Test Script
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test"
}
```

## Priority Test Targets

Given zero current coverage, start with highest-value units:

1. **Payroll calculation logic** (`store.tsx:generatePayroll`) — pure logic, easy to unit test
2. **Auth hashing** (`store.tsx:hashPassword`) — security-critical
3. **Attendance classification** — depends on `config.ts` constants, deterministic
4. **Cash advance state transitions** — lifecycle rules
5. **Component smoke tests** — verify pages render without crash

## Supabase Testing Strategy

For tests involving Supabase calls:
- Use `vi.mock('@/lib/supabase')` to mock the client
- Or use a test Supabase project with seeded data
- Avoid mocking business logic — only mock the DB layer

## Type Checking (Partial Coverage)

TypeScript provides some safety but `strict: true` is not enabled and `any` is used in data mapping (`store.tsx:91,108,124`). Enabling strict mode would surface ~20+ latent type errors.
