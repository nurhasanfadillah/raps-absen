# CONTEXT.md — absen-lembur-semua-status

## Phase Goal

Mengizinkan input jam lembur untuk **semua status kehadiran** (Hadir, Sakit, Izin, Alpa, Libur/Off), bukan hanya status `Present`.

## Background

Saat ini di `pages/Attendance.tsx`, input lembur tersembunyi di dalam blok kondisional `{modalForm.status === 'Present' && (...)}`. Selain itu, saat menyimpan, `overtimeHours` di-reset ke `0` untuk status non-Present. Ini menghalangi kasus nyata di mana karyawan masuk kerja di hari libur/off mereka.

## Goals

1. Input jam lembur muncul di semua status kehadiran
2. Data lembur tersimpan sesuai nilai yang diinput, tanpa reset berdasarkan status
3. Input jam masuk & jam keluar tetap hanya muncul untuk status `Present`

## Approach

- Pindahkan blok overtime input keluar dari kondisional `status === 'Present'`
- Tetap jaga checkInTime, checkOutTime, dan warning box di dalam kondisional `Present`
- Update logika simpan: hapus kondisi reset `overtimeHours` untuk non-Present

## Constraints

- Tidak ada label/badge khusus untuk lembur di hari Off
- Tidak ada batas minimum/maksimum jam lembur
- Tarif lembur tetap sama untuk semua status

## Files to Change

- `pages/Attendance.tsx` — satu-satunya file yang perlu diubah

## Out of Scope

- Perubahan pada kalkulasi payroll / `store.tsx`
- Perubahan tampilan tabel/card list
- Validasi tambahan lainnya
