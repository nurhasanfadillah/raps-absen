---
phase: code-quality-fix
plan: 04
subsystem: ui
tags: [zod, validation, pagination, timezone, constants, react]

requires:
  - phase: code-quality-fix/01-03
    provides: Split store modules dan session persistence (localStorage)

provides:
  - Zod form validation di Employees dan CashAdvance
  - Client-side pagination 10 item/halaman di Employees
  - constants.ts sebagai single source of truth status values
  - utils/format-date.ts utility timezone Asia/Jakarta terpusat
  - Date constraints (min/max) pada Payroll period inputs

affects: [future-forms, future-list-pages]

tech-stack:
  added: [zod ^4.4.3]
  patterns:
    - safeParse + setFormErrors pattern untuk form validation
    - Utility function terpusat untuk timezone formatting
    - Constants object as const untuk magic strings

key-files:
  created: [constants.ts, utils/format-date.ts]
  modified:
    - pages/Employees.tsx
    - pages/CashAdvance.tsx
    - pages/Payroll.tsx
    - pages/ActivityLogs.tsx
    - pages/Dashboard.tsx
    - services/pdfService.ts

key-decisions:
  - "Gunakan Input error prop (sudah ada) untuk tampilkan Zod errors — tidak perlu komponen baru"
  - "Select tidak punya error prop, tampilkan error dengan span manual di bawah wrapper div"
  - "Utility formatJakartaTime return string combined — ActivityLogs/Dashboard updated untuk single-line display"
  - "pdfService call sites: new Date() → new Date().toISOString() agar utility signature tetap string-only"

patterns-established:
  - "Form validation: z.object().safeParse() → setFormErrors() → error={formErrors.field} pada Input"
  - "Pagination inline: ITEMS_PER_PAGE const + currentPage state + filtered.slice() — tidak extract ke hook"
  - "Timezone: selalu import dari utils/format-date, tidak inline toLocaleString/toLocaleDateString"

duration: ~45min
started: 2026-06-19T00:00:00Z
completed: 2026-06-19T00:45:00Z
---

# Phase code-quality-fix Plan 04: Zod Validation + Pagination + Constants + Timezone Summary

**Zod form validation aktif di Employee dan CashAdvance forms, client-side pagination 10/halaman di Employees, constants.ts dan utils/format-date.ts tersedia sebagai shared utilities.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~45 menit |
| Started | 2026-06-19 |
| Completed | 2026-06-19 |
| Tasks | 3 completed |
| Files modified | 6 + 2 created |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Form Employees tidak bisa terima data invalid | Pass | Zod schema: fullName min 3, baseSalary positive, phone min 10, dll |
| AC-2: Kasbon Form tervalidasi | Pass | Zod schema: amount positive, reason min 5, employeeId required |
| AC-3: Pagination aktif di Employees | Pass | 10/halaman, search reset ke page 1, controls hidden bila ≤10 item |
| AC-4: Magic Strings tergantikan Constants | Pass | constants.ts: ATTENDANCE_STATUS, EMPLOYEE_STATUS, PAYROLL_STATUS, ACTION_TYPE |
| AC-5: Timezone konsisten | Pass | formatJakartaTime/formatJakartaDate digunakan di ActivityLogs, Dashboard, pdfService |

## Accomplishments

- Zod validation (safeParse pattern) aktif di 2 form utama — error tampil langsung di bawah field via `error` prop
- Client-side pagination 10/halaman di Employees dengan auto-reset saat search berubah
- Centralized timezone utility menggantikan inline `toLocaleString` di 3 file
- constants.ts tersedia sebagai single source of truth (belum digunakan di seluruh codebase — gradual adoption)
- Payroll date inputs sekarang punya `max={todayDate}` dan `min={periodStart}` constraints

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `constants.ts` | Created | ATTENDANCE_STATUS, EMPLOYEE_STATUS, PAYROLL_STATUS, ACTION_TYPE objects |
| `utils/format-date.ts` | Created | formatJakartaTime + formatJakartaDate dengan Asia/Jakarta timezone |
| `pages/Employees.tsx` | Modified | Zod schema, formErrors state, pagination (ITEMS_PER_PAGE=10), ChevronLeft/Right |
| `pages/CashAdvance.tsx` | Modified | Zod schema, formErrors state (pagination sudah ada dari 01-02) |
| `pages/Payroll.tsx` | Modified | todayDate const, max/min props pada date inputs |
| `pages/ActivityLogs.tsx` | Modified | Import formatJakartaTime dari utility, hapus local function, combined timestamp display |
| `pages/Dashboard.tsx` | Modified | Import formatJakartaTime dari utility, hapus local formatTime/formatDate |
| `services/pdfService.ts` | Modified | Import formatJakartaDate dari utility, hapus local function, new Date() → .toISOString() |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Gunakan Input `error` prop (bukan manual `<p>`) | UIComponents.Input sudah punya error prop built-in | Clean, consistent error display |
| Select error pakai manual `<span>` di wrapper div | Select tidak extend InputProps, tidak ada error prop | Minor inconsistency tapi acceptable |
| formatJakartaTime return combined string | PLAN spec menentukan signature string | ActivityLogs/Dashboard display berubah ke single-line timestamp |
| constants.ts tidak replace semua magic strings sekarang | Plan spec: "gradual adoption, cukup buat file-nya" | No regressions, adoption bisa dilakukan bertahap |
| pdfService: new Date() → new Date().toISOString() | Utility signature string-only, lebih type-safe | Konsisten dengan utility contract |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Minor |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Minimal, tidak ada scope creep.

### Auto-fixed Issues

**1. CashAdvance pagination sudah ada**
- **Found during:** Task 3 review
- **Issue:** CashAdvance.tsx sudah punya pagination lengkap (currentPage, pageSize, ChevronLeft/Right) dari plan 01-02
- **Fix:** Task 3 hanya diterapkan ke Employees.tsx; CashAdvance skip
- **Verification:** grep untuk paginated, totalPages, ChevronLeft di CashAdvance — semua sudah ada
- **Impact:** Scope lebih kecil dari yang direncanakan, hasilnya sama

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| formatJakartaTime return type berbeda dengan local function di ActivityLogs (object vs string) | Redesign rendering ke single-line combined timestamp — acceptable trade-off |

## Next Phase Readiness

**Ready:**
- Phase code-quality-fix selesai (4/4 plans complete)
- TypeScript 0 errors, build berhasil
- Zod tersedia untuk form-form baru di fase berikutnya
- Utility timezone dan constants siap digunakan

**Concerns:**
- constants.ts belum digunakan di seluruh codebase (gradual adoption)
- Bundle size 985KB (warning dari vite), bukan blocker tapi perlu diperhatikan ke depan

**Blockers:** None

---
*Phase: code-quality-fix, Plan: 04*
*Completed: 2026-06-19*
