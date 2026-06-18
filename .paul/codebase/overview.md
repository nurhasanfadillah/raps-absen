# Codebase Overview

## Project Identity

- **Name**: RAPS (Redone Attendance & Payroll System / Sistem Absensi & Penggajian)
- **Type**: Web Application (PWA-capable)
- **Language**: TypeScript + React
- **Domain**: HR Management — attendance tracking, payroll generation, cash advance management
- **UI Language**: Indonesian (Bahasa Indonesia)
- **Theme**: Dark mode throughout

## What This App Does

RAPS is a localized HR management web application for Indonesian businesses. It handles:
1. **Employee management** — CRUD with soft-delete and role assignment
2. **Attendance tracking** — daily check-in/out with automatic half-day detection (threshold: 09:00)
3. **Cash advance management** — request lifecycle with payroll deduction linking
4. **Payroll generation** — client-side calculation with Supabase RPC atomic save
5. **Audit logging** — every action logged to database with user/timestamp/entity
6. **Authentication** — single-admin credentials stored in Supabase `app_config` table

## Technology Snapshot

| Layer | Technology |
|---|---|
| Language | TypeScript 5.8 |
| Framework | React 19 |
| Routing | React Router v7 (HashRouter) |
| State | React Context API + useState |
| Backend | Supabase (PostgreSQL) |
| Offline | IndexedDB via `idb` (schema defined, not yet integrated) |
| Build | Vite 6 |
| Styling | Tailwind CSS (CDN), dark theme |
| Icons | Lucide React |
| Charts | Recharts |
| PDF | Custom `pdfService.ts` (HTML-based) |
| PWA | `sw.js` + `manifest.json` |

## Entry Points

```
index.tsx          → ReactDOM.createRoot → <App>
App.tsx            → AppProvider → FeedbackProvider → HashRouter → AppRoutes
store.tsx          → AppProvider (all global state + all actions)
```

## File Count

~20 TypeScript/React source files across root + `components/`, `pages/`, `lib/`, `services/`.

## Status

Active MVP — feature-complete for core HR workflows, no automated tests, no linting.

## Key Files

| File | Role |
|---|---|
| `store.tsx` | God file: all state + all actions (615 lines) |
| `types.ts` | All entity interfaces and union types |
| `App.tsx` | Router + provider composition |
| `config.ts` | Work-hours constants |
| `lib/supabase.ts` | Supabase client (⚠️ hardcoded credentials) |
| `lib/db.ts` | IndexedDB schema (defined, unused in state) |
| `services/pdfService.ts` | Payslip/report PDF generation |
| `components/UIComponents.tsx` | Reusable UI primitives |
| `components/Feedback.tsx` | Toast + confirm dialog contexts |
| `components/Layout.tsx` | App shell (sidebar + topbar) |
