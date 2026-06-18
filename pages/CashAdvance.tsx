import React, { useState } from 'react';
import { useApp } from '../store';
import { useConfirm, useToast } from '../components/Feedback';
import { Button, Input, Select, Modal } from '../components/UIComponents';
import { Plus, CheckCircle, Edit2, Trash2, AlertTriangle, Calendar, FileText, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { CashAdvance } from '../types';

const CashAdvancePage: React.FC = () => {
  const { employees, cashAdvances, addCashAdvance, updateCashAdvance, deleteCashAdvance, markCashAdvancePaid } = useApp();
  const { confirm } = useConfirm();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: 0,
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const openEdit = (ca: CashAdvance) => {
    setEditingId(ca.id);
    setFormData({
      employeeId: ca.employeeId,
      amount: ca.amount,
      reason: ca.reason,
      date: ca.date
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ employeeId: '', amount: 0, reason: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const existing = cashAdvances.find(c => c.id === editingId);
        if (!existing) return;
        await updateCashAdvance({
          ...existing,
          employeeId: formData.employeeId,
          amount: Number(formData.amount),
          reason: formData.reason,
          date: formData.date
        });
        addToast('success', 'Berhasil Diperbarui', 'Data kasbon telah diperbarui.');
      } else {
        await addCashAdvance({
          id: `CA-${Date.now()}`,
          employeeId: formData.employeeId,
          amount: Number(formData.amount),
          reason: formData.reason,
          date: formData.date,
          isPaid: false
        });
        addToast('success', 'Pengajuan Berhasil', 'Data kasbon baru telah ditambahkan.');
      }
      closeModal();
    } catch (error: any) {
      addToast('error', 'Gagal Menyimpan', error.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  const handleDelete = (id: string, empName: string) => {
    confirm({
      title: 'Hapus Pengajuan Kasbon?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus data kasbon <strong>{empName}</strong>?
        </span>
      ),
      variant: 'danger',
      confirmText: 'Ya, Hapus Data',
      onConfirm: async () => {
        try {
          await deleteCashAdvance(id);
          addToast('success', 'Terhapus', 'Data kasbon berhasil dihapus.');
        } catch (error: any) {
          addToast('error', 'Gagal Menghapus', error.message);
        }
      }
    });
  };

  const handleMarkPaid = (id: string, empName: string, amount: number) => {
    confirm({
      title: 'Konfirmasi Pelunasan',
      message: (
        <span>
          Tandai kasbon atas nama <strong>{empName}</strong> sebesar{' '}
          <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}</strong>{' '}
          sebagai LUNAS?
        </span>
      ),
      variant: 'info',
      confirmText: 'Ya, Tandai Lunas',
      onConfirm: async () => {
        await markCashAdvancePaid(id);
        addToast('success', 'Kasbon Lunas', 'Status kasbon telah diperbarui menjadi lunas.');
      }
    });
  };

  // Data pipeline
  const filtered = cashAdvances.filter(ca => {
    if (filterStatus === 'pending') return !ca.isPaid;
    if (filterStatus === 'paid') return ca.isPaid;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return sortOrder === 'desc' ? diff : -diff;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const changeFilter = (val: typeof filterStatus) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  const changeSort = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Manajemen Kasbon</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola pinjaman dan kasbon karyawan</p>
        </div>
        <Button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="w-full md:w-auto">
          <Plus size={18} /> Ajukan Kasbon
        </Button>
      </div>

      {/* Controls: Filter + Sort */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
          {(['all', 'pending', 'paid'] as const).map(val => (
            <button
              key={val}
              onClick={() => changeFilter(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === val
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {val === 'all' ? 'Semua' : val === 'pending' ? 'Pending' : 'Lunas'}
            </button>
          ))}
        </div>

        <button
          onClick={changeSort}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors w-fit"
        >
          <ArrowUpDown size={13} />
          {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {paginated.map(ca => {
          const emp = employees.find(e => e.id === ca.employeeId);
          const isExpanded = expandedId === ca.id;
          const [, month, day] = ca.date.split('-');
          const dateShort = `${day}/${month}`;

          return (
            <div key={ca.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Collapsed row */}
              <button
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : ca.id)}
              >
                {/* Left col: date + status badge */}
                <div className="flex flex-col items-center justify-center w-14 shrink-0 gap-1.5">
                  <span className="text-sm font-bold text-slate-100 font-mono leading-none">{dateShort}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                    ca.isPaid
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                      : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                  }`}>
                    {ca.isPaid ? 'Lunas' : 'Pending'}
                  </span>
                </div>

                <div className="w-px h-8 bg-slate-800 shrink-0" />

                {/* Right col: name (left) + amount (right) */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{emp?.fullName || 'Unknown'}</div>
                  <div className="text-sm font-mono font-semibold text-slate-100 text-right mt-0.5">{formatCurrency(ca.amount)}</div>
                </div>

                <ChevronDown
                  size={16}
                  className={`shrink-0 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-800 px-4 py-3 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-start gap-2">
                      <FileText size={13} className="shrink-0 text-slate-500 mt-0.5" />
                      <span className="italic">"{ca.reason}"</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="shrink-0 text-slate-500" />
                      <span>{ca.date}</span>
                    </div>
                    {ca.deductedInPayrollId && (
                      <div className="pl-5 text-emerald-400/70">
                        Dipotong di laporan gaji #{ca.deductedInPayrollId.slice(-6)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {!ca.isPaid ? (
                      <Button
                        variant="secondary"
                        className="flex-1 text-xs h-9 hover:bg-emerald-950/30 hover:text-emerald-400 hover:border-emerald-900/50"
                        onClick={e => { e.stopPropagation(); handleMarkPaid(ca.id, emp?.fullName || '', ca.amount); }}
                      >
                        <CheckCircle size={14} /> Tandai Lunas
                      </Button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/20 rounded-lg border border-emerald-900/40 h-9">
                        <CheckCircle size={13} />
                        {ca.deductedInPayrollId ? 'Potong Gaji' : 'Lunas Manual'}
                      </div>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(ca); }}
                      className="h-9 w-9 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(ca.id, emp?.fullName || 'Kasbon'); }}
                      className="h-9 w-9 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 hover:border-rose-900/50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <p className="text-slate-500">
              {filterStatus !== 'all' ? 'Tidak ada data untuk filter ini.' : 'Tidak ada data kasbon.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sorted.length)} dari {sorted.length} data
            </span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-slate-500"
            >
              {[10, 25, 50].map(n => (
                <option key={n} value={n}>{n} / halaman</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="h-8 w-8 flex items-center justify-center text-xs text-slate-600">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`h-8 w-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      currentPage === p
                        ? 'bg-slate-700 text-slate-100 border border-slate-600'
                        : 'border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Pengajuan Kasbon' : 'Pengajuan Kasbon Baru'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Nama Karyawan"
            value={formData.employeeId}
            onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
            required
            disabled={!!editingId}
            className={!!editingId ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <option value="">Pilih Karyawan</option>
            {employees.filter(e => e.status === 'Active').map(e => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </Select>
          <Input
            label="Jumlah (IDR)"
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
            placeholder="0"
          />
          <Input
            label="Tanggal Diperlukan"
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Alasan Pengajuan"
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
            required
            placeholder="Contoh: Biaya berobat"
          />
          {editingId && (
            <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-900/50 flex gap-3">
              <AlertTriangle className="text-amber-500 shrink-0" size={16} />
              <p className="text-xs text-amber-300">
                Mengedit nominal kasbon tidak akan mempengaruhi laporan gaji yang <strong>sudah</strong> dibuat sebelumnya.
                Pastikan laporan gaji periode terkait belum dibuat.
              </p>
            </div>
          )}
          <div className="pt-6 flex justify-end gap-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
            <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Buat Pengajuan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CashAdvancePage;
