# CONTEXT: Kasbon — Default Filter Pending + Hapus Blokir Store Layer

## Phase Summary
Dua perbaikan kecil tapi krusial setelah fase UI sebelumnya:
1. Default filter kasbon diubah ke `pending` agar tampilan awal langsung relevan
2. Blokir edit/hapus di store layer (`store.tsx`) dihapus agar konsisten dengan perubahan UI sebelumnya

## Background
Fase UI kasbon sebelumnya sudah menghapus blokir di sisi UI (`openEdit`), namun store masih melempar error untuk kasbon lunas/terpotong:
- `updateCashAdvance` line 405-408: throws jika `isPaid || deductedInPayrollId`
- `deleteCashAdvance` line 427-430: throws jika `isPaid || deductedInPayrollId`

Akibatnya: tombol Edit/Hapus sudah tampil di UI, tapi operasi tetap gagal saat dieksekusi.

## Goals

1. **Default filter pending** — `filterStatus` di `CashAdvance.tsx` inisialisasi ke `'pending'` bukan `'all'`
2. **Hapus blokir store update** — hapus blok `if (existing.isPaid || existing.deductedInPayrollId)` di `updateCashAdvance`
3. **Hapus blokir store delete** — hapus blok `if (existing.isPaid || existing.deductedInPayrollId)` di `deleteCashAdvance`
4. **Audit log tetap berjalan** — `addAuditLog('UPDATE/DELETE', ...)` tetap dipanggil untuk semua operasi

## Files yang diubah
- `pages/CashAdvance.tsx` — ubah default state filterStatus
- `store.tsx` — hapus blokir di updateCashAdvance dan deleteCashAdvance

## Constraints
- Jangan ubah logika bisnis lain di store (payroll, employee, attendance)
- Audit log TETAP ada — hanya hapus throw error dan auditLog SYSTEM yang menyertai blokir
- Tidak ada perubahan UI tambahan
