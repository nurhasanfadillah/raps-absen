# Codebase Map

Generated: 2026-06-18

## Documents

| Document | Contents |
|---|---|
| [overview.md](./overview.md) | Project identity, tech snapshot, key files, entry points |
| [stack.md](./stack.md) | All dependencies, build tools, env config, package details |
| [architecture.md](./architecture.md) | Directory structure, routing, state shape, data flow, module boundaries |
| [conventions.md](./conventions.md) | File naming, TypeScript patterns, exports, component and hook idioms |
| [testing.md](./testing.md) | Current test state (none), risk areas, recommended setup |
| [integrations.md](./integrations.md) | Supabase tables/RPC, IndexedDB, service worker, Google CDN, PDF service |
| [patterns.md](./patterns.md) | Recurring code patterns to follow when adding features |
| [concerns.md](./concerns.md) | Security issues, technical debt, missing infrastructure |

## Quick Reference

**Codebase**: RAPS — Sistem Absensi & Penggajian (HR Management)
**Stack**: React 19 + TypeScript 5.8 + Vite 6 + Supabase + Tailwind CSS
**Entry**: `index.tsx` → `App.tsx` → `store.tsx` (AppProvider)
**State**: React Context API, single `AppContext` in `store.tsx`
**Pages**: 8 pages in `pages/` (1 per route)
**Tests**: None
**Lint/Format**: Not configured

## Top Concerns

1. **[H1]** Supabase credentials hardcoded in `lib/supabase.ts` — move to env vars
2. **[H2]** Emergency reset code `'301292'` hardcoded in `store.tsx:268`
3. **[H3]** Client-side SHA-256 password hashing — no salt
4. **[H4]** No React Error Boundaries — one crash kills the whole app
5. **[M1]** `store.tsx` is a 615-line god file — needs splitting
