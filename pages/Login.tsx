import React, { useState } from 'react';
import { useApp } from '../store';
import { useToast, useConfirm } from '../components/Feedback';
import { Button, Input, Modal } from '../components/UIComponents';
import { Lock, User, KeyRound, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Updated to the official app icon
const APP_LOGO_URL = "https://lh3.googleusercontent.com/d/1bYamjBUPN3fY948aBV-0J8vnGrC28nZ7";

const Login: React.FC = () => {
  const { login, resetCredentials } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset Modal
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        addToast('warning', 'Validasi', 'Mohon isi username dan password.');
        return;
    }

    setLoading(true);
    try {
        const success = await login(username, password);
        if (success) {
            addToast('success', 'Login Berhasil', 'Selamat datang kembali.');
        } else {
            addToast('error', 'Login Gagal', 'Username atau password salah.');
        }
    } catch (err) {
        addToast('error', 'System Error', 'Terjadi kesalahan sistem.');
    } finally {
        setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
      e.preventDefault();
      confirm({
          title: 'Reset Akun Admin?',
          message: 'Tindakan ini akan mengembalikan username dan password ke default (admin/admin). Gunakan hanya jika darurat.',
          variant: 'danger',
          confirmText: 'Ya, Reset',
          onConfirm: async () => {
             const success = await resetCredentials(secretCode);
             if (success) {
                 addToast('success', 'Reset Berhasil', 'Akun telah direset ke default: admin / admin');
                 setIsResetOpen(false);
                 setSecretCode('');
             } else {
                 addToast('error', 'Kode Salah', 'Kode rahasia tidak valid.');
             }
          }
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Updated Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 to-brand-800" />
        
        <div className="p-8">
            <div className="flex flex-col items-center mb-8">
                <div className="bg-slate-950 p-4 rounded-2xl mb-4 border border-slate-800 shadow-lg">
                    <img src={APP_LOGO_URL} alt="RAPS Logo" className="w-16 h-16 object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">RAPS Login</h1>
                <p className="text-slate-500 text-sm mt-1">Redone Attendance & Payroll System</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-900/50 transition-all text-sm shadow-sm"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="password"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-900/50 transition-all text-sm shadow-sm"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <Button type="submit" isLoading={loading} className="w-full justify-center mt-4">
                    Masuk Sistem
                </Button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => setIsResetOpen(true)}
                    className="text-xs text-slate-500 hover:text-brand-400 transition-colors"
                >
                    Lupa Password?
                </button>
            </div>
        </div>
        
        <div className="bg-slate-950 p-4 text-center border-t border-slate-800">
            <p className="text-[10px] text-slate-600 leading-tight">
                PT. Redone Berkah Mandiri Utama &copy; 2026<br/>
                All Rights Reserved.
            </p>
        </div>
      </div>

      <Modal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} title="Reset Kredensial">
          <form onSubmit={handleReset} className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-900/50 p-3 rounded-lg flex gap-3">
                 <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                 <p className="text-xs text-amber-300">
                     Fitur ini digunakan untuk mereset akun admin kembali ke default (admin/admin). Masukkan kode rahasia perusahaan untuk melanjutkan.
                 </p>
              </div>
              <Input 
                  label="Kode Rahasia"
                  type="password"
                  placeholder="Masukkan 6 digit kode"
                  value={secretCode}
                  onChange={e => setSecretCode(e.target.value)}
              />
              <div className="flex justify-end pt-2">
                  <Button type="submit" variant="danger" disabled={secretCode.length < 3}>
                      <KeyRound size={16} /> Verifikasi & Reset
                  </Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Login;