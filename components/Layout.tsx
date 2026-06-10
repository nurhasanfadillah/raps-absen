import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Wallet, 
  FileText, 
  Menu, 
  LogOut,
  Settings,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useConfirm } from './Feedback';

// Updated to new official sidebar logo
const APP_LOGO_URL = "https://lh3.googleusercontent.com/d/1fINTQmAuWDJdHosZ_bMXjOXXGqbtmsja";

const NavItem = ({ to, icon: Icon, label, onClick }: any) => {
  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium ${
          isActive 
            ? 'bg-gradient-to-r from-brand-900/40 to-brand-900/10 text-brand-400 shadow-sm ring-1 ring-brand-900/50' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`
      }
    >
      <Icon size={18} className={`transition-colors duration-200 ${ ({isActive}: any) => isActive ? 'text-brand-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
      <span>{label}</span>
    </NavLink>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useApp();
  const { confirm } = useConfirm();

  // Monitor Network Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    confirm({
        title: 'Keluar Aplikasi?',
        message: 'Anda harus login kembali untuk mengakses sistem.',
        confirmText: 'Ya, Keluar',
        variant: 'danger',
        onConfirm: () => {
            logout();
        }
    });
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/employees': return 'Data Karyawan';
      case '/attendance': return 'Absensi';
      case '/cash-advance': return 'Kasbon';
      case '/payroll': return 'Penggajian';
      case '/settings': return 'Konfigurasi';
      case '/activity-logs': return 'Log Aktivitas';
      default: return 'Overview';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col
        transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Simplified Header - Logo Only */}
        <div className="h-20 flex items-center justify-center border-b border-slate-800 py-2">
            <img 
              src={APP_LOGO_URL} 
              alt="RAPS Logo" 
              className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105" 
            />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 px-2">Menu Utama</div>
          <NavItem to="/" icon={LayoutDashboard} label="Beranda" onClick={() => setIsMobileOpen(false)} />
          <NavItem to="/employees" icon={Users} label="Data Karyawan" onClick={() => setIsMobileOpen(false)} />
          <NavItem to="/attendance" icon={CalendarCheck} label="Absensi" onClick={() => setIsMobileOpen(false)} />
          
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-8 mb-4 px-2">Keuangan</div>
          <NavItem to="/cash-advance" icon={Wallet} label="Kasbon" onClick={() => setIsMobileOpen(false)} />
          <NavItem to="/payroll" icon={FileText} label="Penggajian" onClick={() => setIsMobileOpen(false)} />
          
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-8 mb-4 px-2">Admin</div>
          <NavItem to="/activity-logs" icon={Activity} label="Log Aktivitas" onClick={() => setIsMobileOpen(false)} />
          <NavItem to="/settings" icon={Settings} label="Konfigurasi" onClick={() => setIsMobileOpen(false)} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-base font-semibold text-slate-200 tracking-wide">
              {getPageTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Network Status Indicator */}
             <div className={`hidden md:flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors duration-300 ${
               isOnline 
                ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' 
                : 'text-rose-400 bg-rose-950/30 border-rose-900/50'
             }`}>
              {isOnline ? (
                <>
                  <Wifi size={14} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </>
              ) : (
                <>
                  <WifiOff size={14} />
                  Offline
                </>
              )}
            </div>

            {/* Interactive User Avatar */}
            <button 
              onClick={() => navigate('/settings')}
              title={`Logged in as ${currentUser || 'Admin'}`}
              className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-800 shadow-lg cursor-pointer hover:opacity-90 transition-all hover:scale-105 hover:ring-brand-900 uppercase"
            >
              {currentUser ? currentUser.substring(0, 2) : 'AD'}
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
           <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};