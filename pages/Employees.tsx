import React, { useState } from 'react';
import { useApp } from '../store';
import { useToast, useConfirm } from '../components/Feedback';
import { Card, Button, Input, Select, Modal, StatusBadge } from '../components/UIComponents';
import { Plus, Search, Edit2, Trash2, MoreVertical, Filter, AlertTriangle, Phone, Mail, Calendar } from 'lucide-react';
import { Employee, Role } from '../types';

const Employees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    role: 'Staff',
    baseSalary: 0,
    overtimeRate: 0,
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (editingId) {
          await updateEmployee({ ...formData, id: editingId } as Employee);
          addToast('success', 'Berhasil Diperbarui', `Data karyawan ${formData.fullName} telah diperbarui.`);
        } else {
          await addEmployee({ 
            ...formData, 
            id: `EMP-${Date.now().toString().slice(-4)}`,
            baseSalary: Number(formData.baseSalary),
            overtimeRate: Number(formData.overtimeRate)
          } as Employee);
          addToast('success', 'Karyawan Ditambahkan', `Berhasil menambahkan ${formData.fullName} ke database.`);
        }
        closeModal();
    } catch (error) {
        addToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data karyawan.');
    }
  };

  const openEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
        title: 'Hapus Karyawan?',
        message: (
            <span>
                Apakah Anda yakin ingin menghapus data karyawan <strong>{name}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
            </span>
        ),
        variant: 'danger',
        confirmText: 'Ya, Hapus',
        onConfirm: async () => {
            try {
                await deleteEmployee(id);
                addToast('success', 'Data Dihapus', `Data karyawan ${name} berhasil dihapus.`);
            } catch (error: any) {
                addToast('error', 'Penghapusan Ditolak', error.message);
            }
        }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      fullName: '', role: 'Staff', baseSalary: 0, overtimeRate: 0, status: 'Active',
      joinDate: new Date().toISOString().split('T')[0], email: '', phone: ''
    });
  };

  const filtered = employees.filter(e => 
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Data Karyawan</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data anggota tim dan jabatan</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 md:top-2.5 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Cari nama atau ID..." 
              className="w-full pl-10 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 md:py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-900/50 transition-all placeholder:text-slate-600 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
            <Plus size={18} /> <span className="md:hidden">Tambah Karyawan</span><span className="hidden md:inline">Baru</span>
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-slate-800 rounded-xl bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-850 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Karyawan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jabatan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Bergabung</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(emp => (
                <tr key={emp.id} className="group hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{emp.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-950/30 flex items-center justify-center text-brand-400 text-xs font-bold border border-brand-900/50">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-200 text-sm">{emp.fullName}</div>
                        <div className="text-xs text-slate-500">{emp.email || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{emp.role}</td>
                  <td className="px-6 py-4"><StatusBadge status={emp.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{emp.joinDate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(emp)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(emp.id, emp.fullName)} className="p-2 hover:bg-red-950/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    Tidak ada karyawan yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Grid/Cards */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-950/30 flex items-center justify-center text-brand-400 font-bold text-sm border border-brand-900/50">
                    {emp.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">{emp.fullName}</h3>
                    <p className="text-xs text-slate-500">{emp.role}</p>
                  </div>
               </div>
               <StatusBadge status={emp.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-xs border-t border-slate-800 py-3">
               <div className="flex flex-col">
                  <span className="text-slate-500 mb-0.5">ID Karyawan</span>
                  <span className="text-slate-300 font-mono">{emp.id}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-slate-500 mb-0.5">Bergabung</span>
                  <span className="text-slate-300 flex items-center gap-1"><Calendar size={12}/> {emp.joinDate}</span>
               </div>
               {emp.phone && (
                   <div className="flex flex-col col-span-2 pt-1">
                      <span className="text-slate-500 mb-0.5">Kontak</span>
                      <div className="flex items-center gap-3">
                         <span className="text-slate-300 flex items-center gap-1"><Phone size={12}/> {emp.phone}</span>
                         {emp.email && <span className="text-slate-300 flex items-center gap-1"><Mail size={12}/> {emp.email}</span>}
                      </div>
                   </div>
               )}
            </div>

            <div className="flex gap-2">
               <Button variant="secondary" className="flex-1 h-9 text-xs" onClick={() => openEdit(emp)}>
                  <Edit2 size={14} /> Edit
               </Button>
               <Button variant="danger" className="h-9 w-9 px-0" onClick={() => handleDelete(emp.id, emp.fullName)}>
                  <Trash2 size={14} />
               </Button>
            </div>
          </div>
        ))}
         {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Tidak ada karyawan yang ditemukan.
            </div>
         )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Nama Lengkap" 
            value={formData.fullName} 
            onChange={e => setFormData({...formData, fullName: e.target.value})} 
            required
            placeholder="Contoh: Budi Santoso"
          />
          <div className="grid grid-cols-2 gap-5">
            <Select 
              label="Jabatan" 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value as Role})}
            >
              <option value="Staff">Staff</option>
              <option value="Manager">Manager</option>
              <option value="Intern">Intern</option>
              <option value="Admin">Admin</option>
            </Select>
            <Select 
              label="Status" 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="Active">Aktif</option>
              <option value="Inactive">Tidak Aktif</option>
            </Select>
          </div>
          <Input 
            label="Alamat Email (Opsional)" 
            type="email" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            placeholder="budi@redone.co.id"
          />
          <Input 
            label="Nomor Telepon" 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
            placeholder="+62 812..."
          />
          <div className="grid grid-cols-2 gap-5">
            <Input 
              label="Gaji Pokok (HARIAN)" 
              type="number" 
              value={formData.baseSalary} 
              onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} 
              placeholder="Contoh: 150000"
              required
            />
            <Input 
              label="Upah Lembur (Per Jam)" 
              type="number" 
              value={formData.overtimeRate} 
              onChange={e => setFormData({...formData, overtimeRate: Number(e.target.value)})} 
              placeholder="0"
              required
            />
          </div>
          <Input 
            label="Tanggal Bergabung" 
            type="date" 
            value={formData.joinDate} 
            onChange={e => setFormData({...formData, joinDate: e.target.value})} 
            required
          />
          <div className="bg-blue-950/30 p-3 rounded-lg border border-blue-900/50 flex gap-3">
              <AlertTriangle className="text-blue-400 shrink-0" size={16} />
              <p className="text-xs text-blue-300">
                  Untuk menjaga integritas data, karyawan yang sudah memiliki riwayat absensi atau gaji tidak dapat dihapus permanen. Gunakan status "Tidak Aktif" sebagai gantinya.
              </p>
          </div>
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={closeModal}>Batal</Button>
            <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Buat Karyawan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;