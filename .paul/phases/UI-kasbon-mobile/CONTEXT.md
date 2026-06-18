# CONTEXT: UI Audit & Improvement — Halaman Kasbon (Mobile)

## Phase Summary
Audit dan perbaikan UI halaman Kasbon (`pages/CashAdvance.tsx`) dengan fokus pada tampilan mobile. Tujuan utama: kompres informasi agar lebih scan-able di layar kecil, tambah sort/filter, buka restriksi edit/hapus, dan tambah pagination.

---

## Goals

1. **Sort waktu** — toggle ascending/descending, default terbaru (descending by `date`)
2. **Filter status** — tab/toggle: Semua | Pending | Lunas
3. **Card compact 2-kolom** dengan expand on tap:
   - Collapsed state (ringkas):
     - Kolom kiri: baris 1 = tanggal `dd/mm`, baris 2 = badge status
     - Kolom kanan: baris 1 (rata kiri) = nama karyawan, baris 2 (rata kanan) = nominal
   - Expanded state (saat diklik): tampilkan alasan, tanggal penuh, + action buttons
4. **Edit & Hapus tanpa restriksi** — hapus pemblokiran berdasarkan `isPaid` / `deductedInPayrollId`; semua record bisa diedit dan dihapus
5. **Pagination** — default 10 item/halaman, opsi: 10 / 25 / 50

---

## Approach

### File yang diubah
- `pages/CashAdvance.tsx` — satu-satunya file yang perlu dimodifikasi

### State baru yang diperlukan
```ts
const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
const [expandedId, setExpandedId] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
```

### Logic pipeline data
```
cashAdvances
  → filter by filterStatus
  → sort by date (sortOrder)
  → slice untuk pagination
```

### Perubahan restriksi edit/hapus
- `openEdit`: hapus early return yang mengecek `ca.isPaid || ca.deductedInPayrollId`
- `handleDelete`: hapus teks "Data yang sudah lunas tidak dapat dihapus" dari confirm dialog
- Warning di form edit (`AlertTriangle`) tetap ada tapi hanya sebagai info, bukan pemblokir

### Layout card compact
```
┌─────────────────────────────────────┐
│ [Tgl]      [Nama Karyawan     ] [▶] │
│ [Status]   [            Rp X.XXX]   │
└─────────────────────────────────────┘
  ↓ saat expand:
┌─────────────────────────────────────┐
│ [Tgl]      [Nama Karyawan     ] [▼] │
│ [Status]   [            Rp X.XXX]   │
│ ─────────────────────────────────── │
│ Alasan: "..."                        │
│ Tanggal: dd/mm/yyyy                  │
│ [Tandai Lunas] [Edit] [Hapus]        │
└─────────────────────────────────────┘
```

### Pagination component
- Tampilkan: `< 1 2 3 ... N >` + dropdown opsi per halaman
- Reset `currentPage` ke 1 saat `filterStatus` atau `sortOrder` berubah

---

## Constraints
- Tidak ada library tambahan — gunakan Tailwind CSS + Lucide yang sudah ada
- Tidak ada perubahan pada `types.ts`, `store.tsx`, atau service layer
- Tidak ada perubahan pada logika bisnis (markPaid, add, update, delete tetap sama)

---

## Out of Scope
- Perubahan halaman lain
- Perubahan backend/service
- Fitur bulk action

---

## Open Questions (sudah terjawab)
- ✅ Default page size: **10**
- ✅ Edit/hapus semua status: **ya, tanpa restriksi** (alasan: koreksi salah input)
- ✅ Warning di form edit: **tetap tampil** sebagai info saja
