---
phase: code-quality-fix
plan: 03
subsystem: architecture
tags: [refactor, store, factory-pattern, indexeddb, idb]

provides:
  - store/ directory dengan 7 modul domain-separated
  - IndexedDB dead code dihapus (lib/db.ts + idb package)

key-files:
  created: [store/index.tsx, store/types.ts, store/audit-actions.ts, store/auth-actions.ts, store/employee-actions.ts, store/attendance-actions.ts, store/cashadvance-actions.ts, store/payroll-actions.ts]
  modified: []
  deleted: [store.tsx, lib/db.ts]

key-decisions:
  - "Factory pattern createXActions(deps) — recreated per render, public API tidak berubah"
  - "supabase diimport langsung per modul (singleton), bukan di-pass sebagai dep"

duration: ~30min
completed: 2026-06-19T00:00:00Z
---

# code-quality-fix Plan 03: Split store.tsx → store/ modules

**store.tsx (733 baris) dipecah menjadi 8 file terpisah per domain; lib/db.ts + idb package (dead code) dihapus bersih.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Public API tidak berubah | Pass | useApp + AppProvider tetap dari `../store` via index.tsx |
| AC-2: Setiap modul hanya berisi domain-nya | Pass | 7 file: types, audit, auth, employee, attendance, cashadvance, payroll |
| AC-3: IndexedDB dependency dihapus | Pass | lib/db.ts deleted, idb uninstalled dari package.json |
| AC-4: Aplikasi berfungsi normal | Pass | TS 0 errors, build sukses |

## Files Created/Modified

| File | Change |
|------|--------|
| `store/types.ts` | Created — AppContextType interface |
| `store/audit-actions.ts` | Created — createAuditActions |
| `store/auth-actions.ts` | Created — session helpers, hashPassword, createAuthActions |
| `store/employee-actions.ts` | Created — createEmployeeActions |
| `store/attendance-actions.ts` | Created — createAttendanceActions |
| `store/cashadvance-actions.ts` | Created — createCashAdvanceActions |
| `store/payroll-actions.ts` | Created — createPayrollActions |
| `store/index.tsx` | Created — AppProvider + useApp, compose semua factories |
| `store.tsx` | Deleted |
| `lib/db.ts` | Deleted |

## Deviations

- supabase diimport langsung per action file (bukan di-pass sebagai dep) — lebih simpel, supabase adalah singleton

## Next Phase Readiness

**Ready:** store/ modular, siap untuk plan 01-04 (Zod validation + pagination + constants + timezone)
**Blockers:** None

---
*Phase: code-quality-fix, Plan: 03 — Completed: 2026-06-19*
