---
phase: code-quality-fix
plan: 01-01
status: complete
date: 2026-06-19
---

# Summary: Tooling Setup

## Completed
- ESLint v9 flat config (`eslint.config.js`) dengan `@typescript-eslint`, `react-hooks`, `prettier`
- Prettier (`.prettierrc`) — singleQuote, trailingComma es5, printWidth 100
- TypeScript `strict: true` + `noUnusedLocals: true`
- Scripts `lint` dan `format` ditambah ke `package.json`
- `@types/react` + `@types/react-dom` diinstall (sebelumnya tidak ada)
- 20 unused imports dihapus dari 9 file

## Deviations
- `.eslintrc.json` diganti `eslint.config.js` — ESLint v9 hanya support flat config
- `@types/react` + `@types/react-dom` perlu diinstall (tidak ada di plan awal)
- `useNavigate()` di `Login.tsx` tetap ada (dipanggil tanpa assign) karena hook harus dipanggil di top-level

## Results
- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors, 24 warnings (semua `any` di Supabase mapping — akan diaddress plan 01-03)
- `npm run build` → ✓ built in 5.22s

## Files Modified
package.json, tsconfig.json, eslint.config.js (new), .prettierrc (new),
components/Feedback.tsx, components/InstallPrompt.tsx,
pages/ActivityLogs.tsx, pages/Attendance.tsx, pages/Employees.tsx,
pages/Login.tsx, pages/Payroll.tsx, pages/Settings.tsx,
services/pdfService.ts, store.tsx
