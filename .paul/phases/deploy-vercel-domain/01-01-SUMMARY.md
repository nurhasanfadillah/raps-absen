---
phase: deploy-vercel-domain
plan: 01
subsystem: infra
tags: [vercel, vite, react, deploy, domain, cloudflare]

requires: []
provides:
  - App live di Vercel production
  - Custom domain raps.redone.my.id aktif
  - SPA routing terkonfigurasi via vercel.json
affects: []

tech-stack:
  added: [vercel-cli]
  patterns: [SPA rewrite rule di vercel.json]

key-files:
  created: [vercel.json]
  modified: [vite.config.ts]

key-decisions:
  - "Gunakan A record (76.76.21.21) bukan nameserver delegation untuk DNS"
  - "vercel alias set diperlukan setelah vercel domains add untuk link deployment"

patterns-established:
  - "vercel.json rewrite /(.*) → /index.html untuk semua SPA Vite"

duration: ~15min
completed: 2026-06-19
---

# Phase deploy-vercel-domain Plan 01: Summary

**Aplikasi RAPS berhasil di-deploy ke Vercel production dan dapat diakses via https://raps.redone.my.id dengan SPA routing yang benar.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 menit |
| Completed | 2026-06-19 |
| Tasks | 3 completed (1 auto + 2 human checkpoint) |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: vercel.json terkonfigurasi | Pass | Rewrite rule `/(.*) → /index.html` aktif |
| AC-2: vite.config.ts bersih | Pass | `loadEnv` dan `GEMINI_API_KEY` define dihapus |
| AC-3: App live di Vercel | Pass | https://raps-master.vercel.app — status Ready |
| AC-4: Domain terhubung | Pass | https://raps.redone.my.id aktif |
| AC-5: Instruksi DNS tersedia | Pass | A record `76.76.21.21` dikomunikasikan ke user |

## Accomplishments

- App ter-deploy ke Vercel production dengan auto-detect Vite (build: `npm run build`, output: `dist`)
- Custom domain `raps.redone.my.id` aktif dan pointing ke Vercel
- SPA routing terkonfigurasi — tidak ada 404 saat refresh di halaman manapun
- Repo GitHub (nurhasanfadillah/raps-absen) terhubung ke Vercel untuk auto-deploy future commits

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `vercel.json` | Created | SPA rewrite rule — semua path ke index.html |
| `vite.config.ts` | Modified | Hapus define block Gemini yang tidak diperlukan |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Gunakan A record bukan nameserver delegation | Domain pakai Cloudflare, A record lebih simpel | DNS cukup tambah 1 record saja |
| `vercel alias set` setelah `vercel domains add` | `domains add` mendaftarkan domain tapi tidak otomatis link ke deployment | Step ini wajib untuk routing domain ke production |

## Deviations from Plan

### Auto-fixed Issues

**1. Domain tidak otomatis terhubung ke deployment**
- **Found during:** Checkpoint 3 (domain)
- **Issue:** `vercel domains add` mendaftarkan domain ke project tapi tidak membuat alias ke deployment aktif
- **Fix:** Jalankan `vercel alias set raps-master.vercel.app raps.redone.my.id`
- **Verification:** CLI output: "Success! https://raps.redone.my.id now points to raps-master.vercel.app"

### Deferred Items

None.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `domains inspect` menampilkan ☓ pada nameservers | Expected — karena pakai A record (option a), bukan nameserver delegation (option b). Tidak mempengaruhi fungsionalitas |

## Next Phase Readiness

**Ready:**
- App live dan dapat diakses publik via custom domain
- GitHub repo terhubung ke Vercel — push ke main akan auto-deploy

**Concerns:**
- Bundle size besar (~909 kB JS). Vercel memperingatkan ini saat build. Pertimbangkan code splitting di fase mendatang jika perlu.

**Blockers:** None
