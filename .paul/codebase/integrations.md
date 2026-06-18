# External Integrations

## Supabase (Primary Backend)

**Package**: `@supabase/supabase-js@2.39.0`
**Client**: `lib/supabase.ts`
**URL**: `https://cztysoswlzakkdamrjbd.supabase.co`

### Database Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `employees` | Master employee data | `id`, `full_name`, `role`, `salary`, `deleted_at` |
| `attendance` | Daily records | `employee_id`, `date`, `check_in_time`, `status` |
| `cash_advances` | Advance requests | `employee_id`, `amount`, `is_paid`, `is_deducted_in_payroll` |
| `payroll_reports` | Payroll headers | `period_start`, `period_end`, `status`, `deleted_at` |
| `payroll_items` | Per-employee payroll line | `payroll_report_id`, `employee_id`, `final_salary` |
| `audit_logs` | System audit trail | `timestamp`, `user_name`, `action_type`, `entity`, `description` |
| `app_config` | Auth credentials storage | `key`, `value` (stores JSON: `{username, passwordHash}`) |

### RPC Functions

| Function | Purpose | Called At |
|---|---|---|
| `save_payroll_transaction` | Atomic insert of report + items + update cash advances | `store.tsx:542` |

### Data Mapping

App maps database snake_case → TypeScript camelCase on every fetch.
Example (`store.tsx:91`):
```ts
setEmployees(empData.map((e: any) => ({
  id: e.id,
  fullName: e.full_name,
  ...
})));
```
**Gap**: mapping uses `(e: any)` — no type validation on incoming data.

### ⚠️ Security Issue

Supabase URL and anon key are **hardcoded** in `lib/supabase.ts:4-5`.
They should be in environment variables:
```ts
// lib/supabase.ts — current (WRONG)
const SUPABASE_URL = 'https://cztysoswlzakkdamrjbd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiI...';

// Should be:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

## IndexedDB via `idb`

**Package**: `idb@^8.0.3`
**Schema file**: `lib/db.ts`
**Status**: ⚠️ **Defined but not used in active state management**

### Defined Schema (`lib/db.ts:5-34`)

```ts
RapsDB (version 2) stores:
- employees        (keyPath: 'id')
- attendance       (keyPath: 'id')
- cash_advances    (keyPath: 'id')
- payroll_reports  (keyPath: 'id')
- audit_logs       (keyPath: 'id')
- auth             (keyPath: 'id')
```

The schema and seed data exist in `lib/db.ts` but `store.tsx` loads all data directly from Supabase. IndexedDB was likely planned for offline support but is not yet wired into the state layer.

---

## Service Worker (PWA)

**File**: `sw.js` (51 lines)
**Registration**: `index.html` (auto-registered)

### Cache Strategy
- **Cache name**: `raps-cache-v1`
- **Navigation requests**: Stale-while-revalidate from cache
- **Precached assets**: Static files + Google Fonts + Google Cloud Storage images

### Limitation
- No background sync for mutations (would require full offline write queue)
- Offline reads work (cached data), offline writes fail silently

---

## Google Services (CDN / Assets)

| Service | Usage | URL Pattern |
|---|---|---|
| Google Fonts | Inter typeface | `fonts.googleapis.com` + `fonts.gstatic.com` |
| Google Cloud Storage | App logo (Login, Layout) | `lh3.googleusercontent.com/d/...` |
| Google Cloud Storage | Report logo (PDF) | `lh3.googleusercontent.com/d/...` |

⚠️ **Risk**: Logo URLs point to Google Drive — these can become inaccessible if the Drive file is deleted or permissions change.

**Fix**: Host logos locally in `/public/`.

---

## Gemini API (Unused)

- API key exposed via Vite env: `vite.config.ts:14-15`
  ```ts
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
  }
  ```
- No Gemini SDK installed, no API calls in source
- `README.md:18` documents this key for future use
- Key should still be in `.env.local`, not `process.env` at build time

---

## PDF Generation

**File**: `services/pdfService.ts`
**Approach**: HTML string → `window.print()` / browser print dialog

- No external PDF library (no jsPDF, no Puppeteer)
- Generates payslip HTML with embedded styles
- Uses Google Cloud Storage logo URL for report header
- Called from `pages/Payroll.tsx`

---

## Integration Dependency Map

```
pages/ ─────→ store.tsx (useApp hook)
                  │
                  ├──→ lib/supabase.ts ──→ Supabase Cloud
                  │
                  └──→ (lib/db.ts) ──→ IndexedDB [disconnected]

pages/Payroll.tsx ──→ services/pdfService.ts ──→ window.print()

components/ ──→ (no external deps beyond React)

index.html ──→ Tailwind CDN ──→ cdn.tailwindcss.com
           ──→ Google Fonts ──→ fonts.googleapis.com

sw.js ──→ Google CDN assets (fonts + images)
```
