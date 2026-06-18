# Concerns & Technical Debt

## HIGH — Fix Before Production

### H1: Hardcoded Supabase Credentials
**File**: `lib/supabase.ts:4-5`
**Issue**: Supabase URL and anon key are embedded directly in source code.
Any user who opens DevTools can read them. Anyone with the repo can access the database.
**Fix**: Move to `.env.local`:
```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```
Also enable Row Level Security (RLS) on Supabase tables.

---

### H2: Hardcoded Emergency Reset Code
**File**: `store.tsx:268`
```ts
if (code === '301292') { ... }
```
**Issue**: Reset code is in source, visible to anyone with repo access.
**Fix**: Store in `app_config` table (same pattern as credentials), never in source.

---

### H3: Client-Side Password Hashing (No Salt)
**File**: `store.tsx:44-49`
**Issue**: SHA-256 without a salt — vulnerable to rainbow table attacks. Hashing done in browser exposes password in memory.
**Fix**: Hash on a backend function (Supabase Edge Function or RPC), use bcrypt/Argon2.

---

### H4: Missing Error Boundaries
**File**: Entire application
**Issue**: No `React.ErrorBoundary` wraps page components. A runtime error in one page crashes the whole app silently.
**Fix**: Add an ErrorBoundary wrapper around page components in `App.tsx`'s route definitions.

---

### H5: `any` Types in Supabase Data Mapping
**File**: `store.tsx:91, 108, 124, 145, 184`
```ts
setEmployees(empData.map((e: any) => ({ ... })))
```
**Issue**: No type validation on incoming DB data. Schema changes cause silent runtime failures.
**Fix**: Use Zod or manually typed guards for DB responses.

---

## MEDIUM — Plan for Next Sprint

### M1: God File — `store.tsx` (615 lines)
**File**: `store.tsx`
**Issue**: All state, all actions, all auth logic, all audit logic in one file. Hard to test, navigate, and extend.
**Fix**: Split into feature contexts:
- `AuthContext` (`store.tsx:214-278`)
- `EmployeeContext` (`store.tsx:282-345`)
- `AttendanceContext` (`store.tsx:347-378`)
- `PayrollContext` (`store.tsx:451-594`)
- Shared `AuditService`

---

### M2: Large Page Components
**Files**:
- `pages/Payroll.tsx` — 312 lines
- `pages/Attendance.tsx` — 308 lines
- `pages/Employees.tsx` — 307 lines
- `pages/ActivityLogs.tsx` — 286 lines

**Issue**: Pages mix UI rendering, form state, validation, and business logic.
**Fix**: Extract custom hooks:
- `usePayrollLogic()` — calculation and filtering
- `useAttendanceForm()` — date navigation and validation
- `useEmployeeTable()` — sorting and filtering

---

### M3: `catch (error: any)` Pattern
**Files**: `pages/CashAdvance.tsx:71`, `pages/Settings.tsx:31`, others
**Issue**: Unsafe — crashes if error is not an Error object.
**Fix**: Use `catch (error: unknown)` with type narrowing:
```ts
catch (error: unknown) {
  const msg = error instanceof Error ? error.message : 'Terjadi kesalahan.';
  addToast('error', 'Gagal', msg);
}
```

---

### M4: No Input Validation Schemas
**Files**: `pages/Employees.tsx`, `pages/Attendance.tsx`, `pages/Payroll.tsx`
**Issue**: Form inputs accepted without schema validation (negative salaries, future dates, etc.).
**Fix**: Add Zod schemas for all entity forms.

---

### M5: Session-Only Auth (No Persistence)
**File**: `store.tsx:71-75`
**Issue**: Auth stored only in `sessionStorage` — user is logged out on page refresh.
**Fix**: Consider `localStorage` with expiry, or Supabase Auth sessions.

---

### M6: External Logo URLs (Link Rot Risk)
**Files**: `pages/Login.tsx:9`, `components/Layout.tsx:20`
**Issue**: App logos loaded from Google Drive URLs — can break without warning.
**Fix**: Download logos and host in `/public/logo.png`.

---

### M7: No Pagination on List Pages
**Files**: `pages/Employees.tsx`, `pages/Attendance.tsx`, `pages/CashAdvance.tsx`
**Issue**: All records loaded and rendered at once. Only `ActivityLogs.tsx` has pagination.
**Fix**: Implement server-side pagination or virtual scrolling.

---

### M8: IndexedDB Defined But Disconnected
**File**: `lib/db.ts`
**Issue**: Full schema defined, `idb` library installed, but never used in state management. Offline capability is incomplete.
**Fix**: Either implement offline sync or remove the unused dependency.

---

## LOW — Technical Debt

### L1: Magic Strings Everywhere
Status values like `'Present'`, `'Sick'`, action types like `'CREATE'`, `'UPDATE'` appear in many files.
**Fix**: Extract to a `constants.ts` file with typed enums.

---

### L2: Inconsistent Timezone Handling
Mixing implicit UTC and explicit `'Asia/Jakarta'` timezone in Dashboard, ActivityLogs, and pdfService.
**Fix**: Create a `formatJakartaTime()` utility used everywhere.

---

### L3: Unused Import
**File**: `components/Layout.tsx:1`
`useRef` is imported but never used.

---

### L4: Toast Dependency Array Gap
**File**: `components/Feedback.tsx:43-45`
Toast timer `useEffect` has empty dependency array but references `toast.id` indirectly via closure.

---

### L5: Missing Accessibility
- Icon-only buttons missing `aria-label`
- Modal doesn't trap focus
- Form `<label>` elements not linked to inputs via `htmlFor`

---

### L6: Date Inputs Without Constraints
**Files**: `pages/Payroll.tsx`, `pages/Attendance.tsx`
No `min`/`max` on date inputs — users can set payroll end before start.

---

## Missing Infrastructure

| Item | Impact |
|---|---|
| No ESLint | Inconsistent style, unused vars, unreachable code undetected |
| No Prettier | Manual formatting inconsistency over time |
| `strict: true` not enabled in TypeScript | Silent `any` propagation |
| No automated tests | No safety net for refactoring |
| No error tracking (Sentry) | Production bugs invisible |
| No bundle analyzer | Uncontrolled bundle growth |
| No database migrations | Schema changes untracked |

---

## Positive Patterns (Keep These)

- **Soft deletes** on employees and payroll — correct pattern for referential integrity
- **Audit log on every action** — built-in traceability
- **Transaction-like payroll save** — uses Supabase RPC for atomicity
- **Consistent UI component library** — Card, Button, Modal in `UIComponents.tsx`
- **Separated feedback context** — Toast and Confirm isolated from business state
- **Client-side payroll generation** — pure function, easily unit-testable when tests are added
- **Dark mode throughout** — consistent design language
- **camelCase ↔ snake_case mapping** — clean boundary between DB and app models
