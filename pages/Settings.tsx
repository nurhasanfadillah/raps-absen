import React, { useState } from 'react';
import { useApp } from '../store';
import { useToast } from '../components/Feedback';
import { Card, Button, Input } from '../components/UIComponents';
import { Shield, Save, Lock } from 'lucide-react';

const Settings: React.FC = () => {
  const { updateCredentials, currentUser } = useApp();
  const { addToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newUsername, setNewUsername] = useState(currentUser || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        addToast('error', 'Validasi Gagal', 'Konfirmasi password baru tidak cocok.');
        return;
    }
    
    setIsLoading(true);
    try {
        await updateCredentials(oldPassword, newUsername, newPassword);
        addToast('success', 'Berhasil', 'Kredensial login berhasil diperbarui.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        addToast('error', 'Gagal', error.message || 'Terjadi kesalahan.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-xl font-bold text-slate-100">Konfigurasi Akun</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola keamanan dan akses login administrator</p>
       </div>

       <div className="max-w-2xl">
           <Card className="border-t-4 border-t-brand-600">
               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                   <div className="p-3 rounded-full bg-brand-950/30 border border-brand-900/50 text-brand-400">
                       <Shield size={24} />
                   </div>
                   <div>
                       <h3 className="text-lg font-semibold text-slate-200">Ganti Password & Username</h3>
                       <p className="text-sm text-slate-500">Pastikan menggunakan password yang kuat untuk keamanan data.</p>
                   </div>
               </div>

               <form onSubmit={handleUpdate} className="space-y-5">
                   <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-4">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifikasi Keamanan</h4>
                       <Input 
                            label="Password Saat Ini" 
                            type="password"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            required
                            placeholder="Masukkan password lama..."
                        />
                   </div>

                   <div className="space-y-4 pt-2">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Baru</h4>
                       <Input 
                            label="Username Baru" 
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            required
                        />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                                label="Password Baru" 
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                placeholder="Min. 5 karakter"
                            />
                            <Input 
                                label="Konfirmasi Password Baru" 
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Ulangi password baru"
                            />
                       </div>
                   </div>

                   <div className="pt-6 flex justify-end">
                       <Button type="submit" isLoading={isLoading}>
                           <Save size={18} /> Simpan Perubahan
                       </Button>
                   </div>
               </form>
           </Card>
       </div>
    </div>
  );
};

export default Settings;