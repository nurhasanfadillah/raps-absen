import React, { useState } from 'react';
import { useApp } from '../store';
import { useConfirm, useToast } from '../components/Feedback';
import { Button, Input, Select, Modal } from '../components/UIComponents';
import { Plus, CheckCircle, Edit2, Trash2, AlertTriangle, Calendar, FileText } from 'lucide-react';
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

  const openEdit = (ca: CashAdvance) => {
    if (ca.isPaid || ca.deductedInPayrollId) {
        addToast('error', 'Akses Ditolak', 'Kasbon yang sudah lunas atau terpotong gaji tidak dapat diedit.');
        return;
    }
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
                Data yang sudah lunas tidak dapat dihapus.
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
                Tandai kasbon atas nama <strong>{empName}</strong> sebesar <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}</strong> sebagai LUNAS?
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-100">Manajemen Kasbon</h2>
           <p className="text-sm text-slate-500 mt-1">Kelola pinjaman dan kasbon karyawan</p>
        </div>
        <Button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="w-full md:w-auto">
          <Plus size={18} /> Ajukan Kasbon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {cashAdvances.map(ca => {
          const emp = employees.find(e => e.id === ca.employeeId);
          const isLocked = ca.isPaid || !!ca.deductedInPayrollId;
          const statusColor = ca.isPaid ? 'emerald' : 'amber';
          
          return (
            <div key={ca.id} className="group bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:shadow-md hover:border-slate-700 transition-all duration-300 relative overflow-hidden flex flex-col">
               {/* Vertical Status Indicator */}
               <div className={`absolute top-0 left-0 w-1.5 h-full bg-${statusColor}-500`} />
               
               <div className="p-4 md:p-6 flex flex-col gap-4 h-full">
                  {/* Row 1: Amount & Status (Primary Focus) */}
                  <div className="flex justify-between items-start pl-2">
                     <div>
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Nominal</span>
                        <div className="text-2xl md:text-3xl font-mono text-slate-100 font-bold tracking-tight">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(ca.amount)}
                        </div>
                     </div>
                     <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide bg-${statusColor}-950/30 text-${statusColor}-400 border-${statusColor}-900/50`}>
                          {ca.isPaid ? 'LUNAS' : 'PENDING'}
                     </span>
                  </div>

                  {/* Row 2: Employee Name (Secondary) */}
                  <div className="pl-2">
                      <div className="font-medium text-slate-300 text-sm md:text-base">{emp?.fullName || 'Unknown Employee'}</div>
                  </div>

                  {/* Row 3: Meta Details (Collapsed look) */}
                  <div className="pl-2 flex-1">
                      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                             <Calendar size={14} className="shrink-0 text-slate-500"/>
                             <span>{ca.date}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-slate-400">
                             <FileText size={14} className="shrink-0 text-slate-500 mt-0.5"/>
                             <span className="leading-relaxed italic line-clamp-2">"{ca.reason}"</span>
                          </div>
                      </div>
                  </div>

                  {/* Row 4: Actions (Touch Optimized) */}
                  <div className="mt-2 pl-2 grid grid-cols-[1fr,auto] gap-2 items-center">
                      {!ca.isPaid ? (
                          <Button 
                            variant="secondary" 
                            className="w-full text-xs h-10 md:h-9 bg-slate-900 hover:bg-emerald-950/30 hover:text-emerald-400 hover:border-emerald-900/50 transition-all" 
                            onClick={() => handleMarkPaid(ca.id, emp?.fullName || '', ca.amount)}
                          >
                            <CheckCircle size={16} /> Tandai Lunas
                          </Button>
                      ) : (
                           <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/30 px-3 py-2.5 rounded-lg border border-emerald-900/50 w-full justify-center h-10 md:h-9">
                              <CheckCircle size={14} />
                              {ca.deductedInPayrollId ? 'Potong Gaji' : 'Manual'}
                           </div>
                      )}

                      {/* Edit/Delete Buttons */}
                      {!isLocked && (
                        <div className="flex gap-2">
                             <button onClick={() => openEdit(ca)} className="h-10 w-10 md:h-9 md:w-9 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(ca.id, emp?.fullName || 'Kasbon')} className="h-10 w-10 md:h-9 md:w-9 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 hover:border-rose-900/50 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                      )}
                  </div>
               </div>
            </div>
          );
        })}
        
        {cashAdvances.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <p className="text-slate-500">Tidak ada data kasbon.</p>
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Pengajuan Kasbon" : "Pengajuan Kasbon Baru"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select 
            label="Nama Karyawan" 
            value={formData.employeeId} 
            onChange={e => setFormData({...formData, employeeId: e.target.value})}
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
            onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
            required
            placeholder="0"
          />
          <Input 
            label="Tanggal Diperlukan" 
            type="date" 
            value={formData.date} 
            onChange={e => setFormData({...formData, date: e.target.value})}
            required
          />
          <Input 
            label="Alasan Pengajuan" 
            value={formData.reason} 
            onChange={e => setFormData({...formData, reason: e.target.value})}
            required
            placeholder="Contoh: Biaya berobat"
          />
          {editingId && (
              <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-900/50 flex gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                  <p className="text-xs text-amber-300">
                      Mengedit nominal kasbon tidak akan mempengaruhi laporan gaji yang <strong>sudah</strong> dibuat sebelumnya. Pastikan laporan gaji periode terkait belum dibuat.
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