# Phase Context: pwa-installable

## Phase
PWA Installable — Fix install prompt dan installability

## Goals
1. App bisa di-install di HP (Android/iOS/Desktop)
2. Muncul banner/tombol install di dalam app (beforeinstallprompt)

## Root Cause Identified
1. Icon hanya SVG — Chrome wajib PNG 192×192 + 512×512
2. Tidak ada beforeinstallprompt handler di React
3. start_url "/" tidak cocok dengan HashRouter

## Approach
- Generate PNG icons dari SVG menggunakan sharp (devDependency)
- Update manifest.json: icons → PNG, fix start_url → "./"
- Update index.html: apple-touch-icon → PNG
- Buat komponen InstallPrompt.tsx untuk handle beforeinstallprompt
- Mount komponen di App.tsx

## Constraints
- Tidak ubah service worker (sw.js sudah cukup)
- Tidak ubah routing/struktur app
- Keep dark theme, tampilan banner minimal dan tidak mengganggu

## Status
Ready for execution
