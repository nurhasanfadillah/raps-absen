# CONTEXT.md — deploy-vercel-domain

## Phase Goal

Deploy aplikasi ke Vercel via CLI dan menghubungkan domain `raps.redone.my.id`.

## Background

Aplikasi adalah React + Vite SPA dengan Supabase (credentials hardcoded). Belum ada konfigurasi deploy sama sekali. Repo sudah ada di GitHub. User punya kontrol DNS untuk `redone.my.id`.

## Goals

1. Tambah `vercel.json` untuk SPA routing (mencegah 404 saat refresh)
2. Bersihkan `vite.config.ts` dari define block Gemini yang sudah tidak digunakan
3. Deploy ke Vercel production via CLI (`npx vercel --prod`)
4. Hubungkan custom domain `raps.redone.my.id` via CLI
5. Berikan instruksi DNS CNAME yang perlu dikonfigurasi manual di DNS panel

## Approach

- Gunakan Vercel CLI (`npx vercel`) — bukan Vercel dashboard
- `vercel login` hanya sekali (browser auth), setelah itu semua via terminal
- `vercel.json` berisi rewrite rule: semua path → `index.html`
- Build command dan output dir auto-detect oleh Vercel (Vite: `npm run build`, output: `dist`)

## Constraints

- Tidak ada environment variables yang perlu dikonfigurasi
- Supabase credentials tetap hardcoded (tidak perlu diubah)
- DNS configuration tetap manual (user yang eksekusi di DNS panel)

## Files to Change

- `vercel.json` — baru, SPA routing config
- `vite.config.ts` — hapus define block untuk GEMINI_API_KEY

## Out of Scope

- Mengubah cara Supabase dikonfigurasi
- CI/CD pipeline
- Preview deployments / branch deploys
