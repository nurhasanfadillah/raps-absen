# Architecture & Structure

## Directory Layout

```
raps-master/
├── index.tsx               ← ReactDOM entry point
├── App.tsx                 ← Router + provider composition
├── store.tsx               ← ALL global state + ALL actions (615 lines — god file)
├── types.ts                ← Centralized TypeScript interfaces
├── config.ts               ← Work-hours constants
├── index.html              ← HTML shell + Tailwind CDN + custom CSS
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker
├── vite.config.ts          ← Build config
├── tsconfig.json           ← TypeScript config
├── package.json
│
├── components/             ← Shared, reusable UI
│   ├── Layout.tsx          ← App shell (sidebar, topbar, mobile nav)
│   ├── Feedback.tsx        ← Toast + confirm dialog contexts
│   └── UIComponents.tsx    ← Primitives: Card, Button, Input, Select, Modal, StatusBadge
│
├── pages/                  ← One component per route
│   ├── Dashboard.tsx       ← Stats overview + bar charts
│   ├── Employees.tsx       ← Employee CRUD (307 lines)
│   ├── Attendance.tsx      ← Daily attendance grid + modal (308 lines)
│   ├── CashAdvance.tsx     ← Advance request management
│   ├── Payroll.tsx         ← Report generation + PDF export (312 lines)
│   ├── Login.tsx           ← Authentication form
│   ├── Settings.tsx        ← Credential management
│   └── ActivityLogs.tsx    ← Audit log viewer (286 lines)
│
├── lib/                    ← External service clients
│   ├── supabase.ts         ← Supabase client instance
│   └── db.ts               ← IndexedDB schema (defined, unused in state)
│
└── services/               ← Isolated business utilities
    └── pdfService.ts       ← Payslip + report HTML→PDF generation
```

## Bootstrap Sequence

```
1. index.tsx       → ReactDOM.createRoot('#root') → <React.StrictMode><App>
2. App.tsx         → <AppProvider> → <FeedbackProvider> → <HashRouter> → <AppRoutes>
3. store.tsx       → AppProvider useEffect:
                      - Restore session from sessionStorage('raps_user')
                      - Call loadData() → fetch all Supabase tables
                      - setIsLoading(false)
4. App.tsx         → ProtectedRoute checks isAuthenticated + isLoading
5. components/     → Layout renders sidebar + topbar
6. pages/          → Active route renders page component
```

## Routing

**Type**: HashRouter (React Router v7)
**Config**: `App.tsx:24-37`

| Route | Component | Protected |
|---|---|---|
| `/` | `Dashboard` | Yes |
| `/employees` | `Employees` | Yes |
| `/attendance` | `Attendance` | Yes |
| `/cash-advance` | `CashAdvance` | Yes |
| `/payroll` | `Payroll` | Yes |
| `/settings` | `Settings` | Yes |
| `/activity-logs` | `ActivityLogs` | Yes |
| `(no route)` | `Login` | No |
| `*` | Redirect to `/` | — |

**Guard** (`App.tsx:15-22`):
```tsx
ProtectedRoute → checks isLoading → checks isAuthenticated → <Layout>{children}
                                   → shows Login if not authenticated
```

## State Architecture

**Pattern**: Single React Context + `useState` (no external library)

**Global state shape** (`store.tsx:5-39`, `AppContextType`):
```ts
// Data
employees: Employee[]
attendance: AttendanceRecord[]
cashAdvances: CashAdvance[]
payrollReports: PayrollReport[]
auditLogs: AuditLog[]

// Auth
isAuthenticated: boolean
currentUser: string | null
isLoading: boolean

// Actions (all async)
login / logout / updateCredentials / resetCredentials
addEmployee / updateEmployee / deleteEmployee
markAttendance / getAttendanceByDate
addCashAdvance / updateCashAdvance / deleteCashAdvance / markCashAdvancePaid
generatePayroll / savePayrollReport / deletePayrollReport
```

**Feedback state** — separate context in `Feedback.tsx`:
- `useToast()` → toast notifications (auto-dismiss 5s)
- `useConfirm()` → modal confirmation dialogs

## Component Hierarchy

```
App
└── AppProvider (store.tsx)
    └── FeedbackProvider (Feedback.tsx)
        └── HashRouter
            └── AppRoutes
                ├── ProtectedRoute → Layout → [Page Components]
                │   ├── Dashboard
                │   ├── Employees
                │   ├── Attendance
                │   ├── CashAdvance
                │   ├── Payroll
                │   ├── Settings
                │   └── ActivityLogs
                └── Login (unguarded)
```

**Shared components** used by pages:
- `UIComponents.tsx` — Card, Button, Input, Select, Modal, StatusBadge
- `Feedback.tsx` — useToast, useConfirm hooks
- `Layout.tsx` — sidebar + topbar shell

## Data Flow

**Pattern**: Unidirectional — Pages → Store Actions → Supabase → React State → Re-render

**Example: Add Employee**
```
1. User submits form in Employees.tsx
2. handleSubmit calls addEmployee() from useApp()
3. store.tsx::addEmployee (lines 282-301):
   a. Transform data: camelCase → snake_case for DB
   b. INSERT to Supabase employees table
   c. Call addAuditLog() internally
   d. Optimistic update: setEmployees(prev => [...prev, newEmp])
4. Page receives updated array via context re-render
5. useToast() fires success notification
```

**Load-once pattern**: `loadData()` fetches all tables on mount, no real-time subscriptions.

## Module Boundaries

Each feature module is split across two layers:

| Module | Store Layer (`store.tsx` lines) | Page Layer |
|---|---|---|
| Auth | 214–278 | `pages/Login.tsx`, `pages/Settings.tsx` |
| Employees | 282–345 | `pages/Employees.tsx` |
| Attendance | 347–378 | `pages/Attendance.tsx` |
| Cash Advance | 381–447 | `pages/CashAdvance.tsx` |
| Payroll | 451–594 | `pages/Payroll.tsx` + `services/pdfService.ts` |
| Audit Logs | 197–211 | `pages/ActivityLogs.tsx` |

**Cross-module communication**: Only through `useApp()` context hook — no direct page-to-page imports.

## Key Architectural Decisions

1. **Context-only state** — no Redux/Zustand; appropriate for app size (~5 entities, simple CRUD)
2. **Client-side payroll calculation** — `generatePayroll()` runs in browser; Supabase RPC only for atomic save
3. **Soft deletes** — employees and payroll reports use `deleted_at` flag, preserving referential integrity
4. **Audit trail built-in** — `addAuditLog()` called inside every create/update/delete/auth action
5. **HashRouter** — avoids server-side routing config; works on static hosting
6. **Load-once data** — all data fetched at boot, no subscriptions or polling
