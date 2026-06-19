---
phase: code-quality-fix
plan: 02
subsystem: auth
tags: [error-boundary, localStorage, session, sha256, catch-unknown, react]

requires:
  - phase: code-quality-fix plan 01
    provides: ESLint + TypeScript strict mode configured

provides:
  - ErrorBoundary component wrapping semua routes
  - Session persistence via localStorage dengan 8 jam expiry
  - Password hashing dengan username salt (SHA-256)
  - Semua catch blocks menggunakan error: unknown pattern
  - Bug fix payroll query (.eq bukan .is)

affects: [code-quality-fix plan 03, Settings page, login flow]

tech-stack:
  added: []
  patterns:
    - "catch (error: unknown) + instanceof Error narrowing"
    - "localStorage session dengan { username, expiresAt } structure"
    - "hashPassword(password, salt) untuk semua auth operations"

key-files:
  created: [components/error-boundary.tsx]
  modified: [App.tsx, store.tsx, pages/CashAdvance.tsx, pages/Settings.tsx, pages/Employees.tsx, pages/Attendance.tsx]

key-decisions:
  - "localStorage + 8h expiry menggantikan sessionStorage (logout saat refresh)"
  - "Username sebagai salt SHA-256 (interim, bukan bcrypt, tanpa backend)"
  - "Hash lama di Supabase perlu diupdate manual via Settings setelah deploy"

patterns-established:
  - "catch (error: unknown) { const msg = error instanceof Error ? error.message : 'fallback'; }"
  - "saveSession/loadSession/clearSession helper pattern untuk localStorage"

duration: ~25min
started: 2026-06-19T00:00:00Z
completed: 2026-06-19T00:00:00Z
---

# code-quality-fix Plan 02: Bug Fixes, Error Boundary, Session & Password Hardening

**ErrorBoundary route-level ditambahkan, sessionStorage diganti localStorage+8h, SHA-256 password kini menggunakan username salt, dan semua catch blocks menggunakan `error: unknown` dengan proper narrowing.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~25 menit |
| Tasks | 2/2 completed |
| Files modified | 7 |
| Files created | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: App tidak crash total saat runtime error | Pass | ErrorBoundary class component wrap AppRoutes |
| AC-2: Session persist setelah refresh | Pass | localStorage dengan expiresAt 8h |
| AC-3: Session auto-expire setelah 8 jam | Pass | loadSession() cek Date.now() > expiresAt |
| AC-4: Bug payroll query diperbaiki | Pass | `.is()` → `.eq('is_deleted', false)` di store.tsx:153 |
| AC-5: Error handling aman di semua pages | Pass | 6 catch blocks diupdate ke `error: unknown` |

## Files Created/Modified

| File | Change | Detail |
|------|--------|--------|
| `components/error-boundary.tsx` | Created | Class component ErrorBoundary, tampilkan UI ramah + reload button |
| `App.tsx` | Modified | Import ErrorBoundary, wrap `<AppRoutes />` |
| `store.tsx` | Modified | Session helpers, hashPassword+salt, ganti semua sessionStorage calls |
| `pages/CashAdvance.tsx` | Modified | 2 catch blocks: handleSubmit + handleDelete |
| `pages/Settings.tsx` | Modified | 1 catch block: handleUpdate |
| `pages/Employees.tsx` | Modified | 2 catch blocks: handleSubmit + handleDelete |
| `pages/Attendance.tsx` | Modified | 1 catch block: handleSaveModal |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| localStorage + 8h expiry | sessionStorage logout saat refresh (bug dilaporkan) | User tetap login dalam 8 jam, auto-logout setelahnya |
| Username sebagai salt SHA-256 | Tanpa backend Edge Function, tidak bisa bcrypt | Hash lama di Supabase tidak cocok sampai credentials diupdate |
| ErrorBoundary hanya route-level | Per-component terlalu granular untuk skala app ini | Crash di satu halaman tidak memutihkan seluruh app |

## Deviations from Plan

None — plan dieksekusi tepat seperti yang tertulis.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Hash lama di Supabase tidak cocok dengan hash baru (salted) | Diketahui dan didokumentasikan — admin perlu update credentials sekali via Settings setelah deploy |

## Next Phase Readiness

**Ready:**
- TypeScript strict terpenuhi (0 errors), build sukses
- Error recovery siap untuk plan 01-03 (split store.tsx)
- Pola catch(unknown) konsisten di semua pages

**Concerns:**
- Login akan gagal setelah deploy sampai admin update credentials via Settings (hash migration)

**Blockers:**
- None — siap untuk plan 01-03

---
*Phase: code-quality-fix, Plan: 02*
*Completed: 2026-06-19*
