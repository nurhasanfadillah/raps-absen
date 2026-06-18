# Technology Stack

## Languages & Runtimes

| Item | Version | Source |
|---|---|---|
| TypeScript | `~5.8.2` | `package.json:23` |
| JavaScript target | ES2022 | `tsconfig.json:3` |
| JSX | `react-jsx` (automatic) | `tsconfig.json:20` |
| Node.js | Unspecified (no `.nvmrc`) | — |

## Core Frameworks

| Package | Version | Role | Source |
|---|---|---|---|
| `react` | `^19.2.4` | UI framework | `package.json:12` |
| `react-dom` | `^19.2.4` | DOM renderer | `package.json:14` |
| `react-router-dom` | `^7.13.0` | Routing (HashRouter) | `package.json:15` |

## UI & Styling

| Item | Version/Detail | Source |
|---|---|---|
| Tailwind CSS | CDN (latest) | `index.html:18` |
| Custom Tailwind config | Dark mode, brand colors `#dc2626` | `index.html:21-70` |
| `lucide-react` | `^0.574.0` | Icons | `package.json:13` |
| `recharts` | `^3.7.0` | Charts (Dashboard) | `package.json:16` |
| Google Fonts (Inter) | 300–700 weights | `index.html:19` |
| Custom CSS | Inline in `<style>` block | `index.html:72-120` |

## State Management

- **React Context API** — single `AppContext` in `store.tsx:41`
- **No Redux / Zustand** — pure `useState` + `useContext`
- **FeedbackContext** — separate context for toast/confirm in `components/Feedback.tsx:35-36`

## Build Tools

| Tool | Version | Config File |
|---|---|---|
| Vite | `^6.2.0` | `vite.config.ts` |
| `@vitejs/plugin-react` | `^5.0.0` | `vite.config.ts:5` |
| Path alias `@/*` → `./` | — | `vite.config.ts` + `tsconfig.json:22-24` |
| Dev server | port 3000, host 0.0.0.0 | `vite.config.ts:8-9` |

**Scripts** (`package.json:6-9`):
```
dev      → vite
build    → vite build
preview  → vite preview
```

## External Integrations

### Supabase
- Package: `@supabase/supabase-js@2.39.0` (`package.json:17`)
- Client: `lib/supabase.ts:2-7`
- URL: `https://cztysoswlzakkdamrjbd.supabase.co`
- **⚠️ Anon key hardcoded in source** — should be env variable

**Tables accessed:**
- `employees` — master data
- `attendance` — daily records
- `cash_advances` — advance requests
- `payroll_reports` + `payroll_items` — payroll documents
- `audit_logs` — system audit trail
- `app_config` — authentication credentials storage

**RPC functions:**
- `save_payroll_transaction` — atomic payroll save (`store.tsx:542`)

### IndexedDB (idb)
- Package: `idb@^8.0.3` (`package.json:18`)
- Schema: `lib/db.ts` — defines stores for all entities + auth
- **Status: Schema defined, not integrated into active state management**

### Service Worker (PWA)
- File: `sw.js` (51 lines)
- Cache strategy: stale-while-revalidate for navigation
- Caches: static assets + Google Fonts/images

### Google Services
- Google Fonts CDN (`index.html:19`)
- Google Cloud Storage for logos (`pages/Login.tsx:9`, `components/Layout.tsx:20`)
  - These are external URLs — **risk of link rot**

### Gemini API
- Key exposed via `vite.config.ts:14-15` as `GEMINI_API_KEY`
- **Not actively used** in current codebase — defined but no calls found

## Package Manager

- **npm** (inferred; `package.json` present)
- Production deps: 6 packages
- Dev deps: 4 packages (`vite`, `@vitejs/plugin-react`, `typescript`, `@types/node`)

## Environment Config

- Vite reads `.env` files — no `.env.example` committed
- `config.ts` — work-hours constants:
  ```ts
  WORK_START_TIME = '08:00'
  HALF_DAY_THRESHOLD_TIME = '09:00'
  DEFAULT_CHECK_OUT_TIME = '17:00'
  ```
- `README.md:18` references `.env.local` for `GEMINI_API_KEY`
