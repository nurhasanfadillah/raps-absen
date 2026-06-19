---
phase: code-quality-fix
topic: Technical decisions for code quality improvement — RAPS
depth: standard
confidence: HIGH
created: 2026-06-19
---

# Discovery: Perbaikan Code Quality RAPS

**Recommendation:** Implementasi bertahap dalam 4 kelompok berurutan — infrastruktur dulu, lalu keamanan, lalu arsitektur, lalu UX.

**Confidence:** HIGH — semua keputusan berdasarkan codebase aktual dan pilihan yang well-established.

## Objective

Keputusan teknis yang perlu dibuat sebelum planning:

1. Bagaimana split `store.tsx` yang 615 baris tanpa break existing functionality?
2. Session persistence: `sessionStorage` → apa yang paling pragmatis?
3. Pagination: client-side atau server-side?
4. `IndexedDB` (`lib/db.ts`): hapus atau implementasikan?
5. Password hashing: solusi minimal tanpa Edge Function?
6. Error boundary: library baru atau class component?
7. Validasi input: Zod atau manual?
8. ESLint/Prettier: config apa?

## Scope

**Include:**
- Semua temuan audit KECUALI: credentials hardcoded, kode reset '301292', dan pindah logo

**Exclude:**
- Offline sync / IndexedDB full implementation
- Supabase Auth migration
- Real-time subscriptions
- Backend Edge Functions

---

## Keputusan 1: Split `store.tsx`

### Opsi A: Feature Contexts (Multiple Contexts)
Pisah menjadi `AuthContext`, `EmployeeContext`, `AttendanceContext`, dll. Setiap page hanya subscribe ke context yang relevan.

**Pros:** Tree-shaking re-renders, separation of concern bersih  
**Cons:** Beberapa aksi cross-context (payroll butuh attendance + employees + cashAdvances)

**Untuk use case kita:** Payroll context harus consume 3 context lain — circular dependency risk.

### Opsi B: Single Context + Custom Hooks (Recommended)
Tetap satu `AppContext` tapi pecah *file* store.tsx menjadi modul-modul:
- `store/employee-actions.ts` — addEmployee, updateEmployee, deleteEmployee
- `store/attendance-actions.ts` — markAttendance, getAttendanceByDate
- `store/cashadvance-actions.ts`
- `store/payroll-actions.ts`
- `store/auth-actions.ts`
- `store/index.tsx` — compose semua actions, export `AppProvider` + `useApp`

**Pros:** Tidak perlu refactor semua page, akses cross-entity tetap mudah, file kecil-kecil  
**Cons:** Tetap satu context (re-render semua subscriber saat state apapun berubah) — tapi ini sudah behaviour sekarang dan acceptable untuk skala app ini

**Recommendation: Opsi B** — minimal disruption, tetap bisa berjalan, file jadi manageable.

---

## Keputusan 2: Session Persistence

### Opsi A: `sessionStorage` (Current)
User logout setiap refresh/tutup tab.

**Cons:** UX sangat buruk untuk aplikasi operasional harian.

### Opsi B: `localStorage` Biasa
Persist selamanya sampai logout manual.

**Cons:** Tidak ada expiry — jika device dipinjam, session aktif selamanya.

### Opsi C: `localStorage` + Expiry (Recommended)
Simpan `{ username, expiresAt }` di localStorage. Expiry: 8 jam (1 hari kerja).

```ts
const SESSION_KEY = 'raps_session';
const SESSION_HOURS = 8;
// Simpan: { username, expiresAt: Date.now() + 8*60*60*1000 }
// Cek: if (Date.now() > session.expiresAt) → logout
```

**Pros:** Persist antar refresh, auto-expire, tidak perlu library baru  
**Cons:** Token tidak di-invalidate server-side (tapi app ini memang tidak punya server auth)

### Opsi D: Supabase Auth
Proper auth dengan JWT refresh token. Butuh refactor besar `login`/`logout`/`updateCredentials`.

**Terlalu besar untuk scope ini.** Exclude.

**Recommendation: Opsi C** — pragmatis, improvement signifikan, ~20 baris perubahan.

---

## Keputusan 3: Pagination

### Konteks
- **Attendance**: Sudah per-hari, tidak perlu pagination
- **Employees**: Saat ini muat semua, biasanya < 50 karyawan
- **CashAdvance**: Bisa bertambah banyak seiring waktu
- **ActivityLogs**: Sudah ada pagination (sudah benar)

### Opsi A: Server-Side Pagination (Supabase `.range()`)
Fetch hanya halaman yang dibutuhkan dari Supabase.

**Pros:** Optimal untuk data besar  
**Cons:** Butuh state management tambahan, loading per-page, perubahan di store

### Opsi B: Client-Side Pagination (Filter dari Data yang Sudah Ada)
Data sudah di-load semua, pagination hanya di UI layer.

**Pros:** Tidak perlu ubah store/Supabase queries, simple  
**Cons:** Data besar masih di-load semua

**Recommendation: Opsi B** — untuk skala HRMS kecil-menengah (< 200 karyawan, < 1000 kasbon), client-side pagination cukup dan jauh lebih simpel. Terapkan di `Employees.tsx` dan `CashAdvance.tsx` dengan hook `usePagination`.

---

## Keputusan 4: IndexedDB (`lib/db.ts`)

### Opsi A: Hapus
Remove `lib/db.ts` dan uninstall `idb` package. 

**Pros:** Kode lebih bersih, tidak ada dead code  
**Cons:** Harus implement ulang jika suatu saat butuh offline

### Opsi B: Implementasi Offline Sync
Gunakan IndexedDB sebagai local cache + sync ke Supabase saat online.

**Butuh sprint tersendiri.** Terlalu besar.

**Recommendation: Opsi A** — hapus. Offline sync adalah fitur besar yang butuh planning tersendiri. Dead code adalah noise.

---

## Keputusan 5: Password Hashing

### Situasi Sekarang
SHA-256 tanpa salt di client. Rentan rainbow table.

### Opsi A: SHA-256 + Per-User Salt (Minimal Fix)
Tambah salt dari username atau random. Simpan salt + hash di `app_config`.

```ts
const hash = await sha256(password + username); // simple salt
```

**Pros:** Tidak butuh backend, perubahan kecil  
**Cons:** SHA-256 tetap cepat (tidak ideal untuk password), tapi jauh lebih baik dari sekarang

### Opsi B: Supabase Edge Function + bcrypt
Proper solution. Butuh deploy Edge Function.

**Di luar scope ini.**

**Recommendation: Opsi A** — tambah salt dari username. Ini hardening minimal yang tidak butuh backend changes. Document sebagai interim fix.

---

## Keputusan 6: Error Boundary

### Opsi A: Class Component Manual
```tsx
class ErrorBoundary extends React.Component { ... }
```
Tidak butuh dependency baru.

### Opsi B: Library `react-error-boundary`
Ergonomis, actively maintained, hook support.

**Recommendation: Opsi A** — satu class component cukup, tidak perlu tambah dependency untuk kebutuhan sederhana ini.

---

## Keputusan 7: Validasi Input

### Opsi A: Zod
Library validasi TypeScript-first, widely used.

**Pros:** Type inference otomatis, reusable schemas, ekosistem besar  
**Cons:** Dependency baru, overhead kecil

### Opsi B: Manual Validation
Validasi kondisional seperti yang sudah ada.

**Pros:** Tidak butuh dependency  
**Cons:** Tidak consistent, tidak reusable, mudah terlewat

**Recommendation: Opsi A (Zod)** — standard untuk project TypeScript, sangat populer, membantu enforce kontrak data.

---

## Keputusan 8: ESLint + Prettier

**Tidak ada pilihan berarti di sini — ini adalah setup standar.**

Config:
- `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`
- `eslint-plugin-react` + `eslint-plugin-react-hooks`
- `prettier` + `eslint-config-prettier`
- `.eslintrc.json` dengan `strict: false` di start (tidak ingin blocking errors dulu), enable `react-hooks/exhaustive-deps`

---

## Recommendation: Urutan Implementasi

### Kelompok 1: Infrastruktur (Tanpa Risk) — ~1 jam
1. ESLint + Prettier setup
2. TypeScript `strict: true`
3. Error Boundary di `App.tsx`
4. Fix `catch (error: unknown)` di semua files
5. Fix bug `.is()` → `.eq()` di payroll query

### Kelompok 2: Keamanan (Risk Rendah) — ~1 jam
6. Session persistence → localStorage + expiry
7. Password hashing + salt dari username

### Kelompok 3: Arsitektur (Risk Sedang) — ~3-4 jam
8. Split `store.tsx` → `store/` directory dengan action files
9. Tambah Zod validation di Employees, CashAdvance form
10. Hapus `lib/db.ts` dan uninstall `idb`

### Kelompok 4: UX (Risk Rendah) — ~2 jam
11. Client-side pagination di Employees + CashAdvance
12. Magic strings → `constants.ts`
13. Timezone utility `formatJakartaTime()`
14. Accessibility fixes (aria-label, date constraints)

---

## Open Questions

- **TypeScript strict errors**: Setelah `strict: true` diaktifkan, kemungkinan ada puluhan type error baru. Perlu waktu untuk fix satu per satu. Impact: **Medium** — bisa jadi lebih besar dari estimasi.
- **Zod runtime validation**: Apakah validasi Zod perlu juga di store actions, atau cukup di form? Impact: **Low** — bisa decide saat implementation.

---

## Quality Report

**Sources consulted:**
- Codebase langsung: `store.tsx`, `pages/Attendance.tsx`, `lib/db.ts`, `tsconfig.json`, `package.json`
- Codebase map: `.paul/codebase/concerns.md`, `architecture.md`, `overview.md`
- Audit hasil sesi ini (2026-06-19)

**Verification:**
- Bug `.is('is_deleted', false)`: Terverifikasi di `store.tsx:138`
- sessionStorage-only auth: Terverifikasi di `store.tsx:71-75`
- IndexedDB tidak dipakai: Terverifikasi — tidak ada import `lib/db.ts` di file manapun
- `any` types di data mapping: Terverifikasi di `store.tsx:91, 108, 124, 145, 184`
- TypeScript strict tidak aktif: Terverifikasi di `tsconfig.json` (tidak ada `"strict": true`)

**Assumptions (not verified):**
- TypeScript strict errors count: diasumsikan > 20, belum di-run
- App scale: diasumsikan < 200 karyawan (client-side pagination mencukupi)

---
*Discovery completed: 2026-06-19*
*Confidence: HIGH*
*Ready for: /paul:plan code-quality-fix*
