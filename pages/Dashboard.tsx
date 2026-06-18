import React from 'react';
import { useApp } from '../store';
import { Card } from '../components/UIComponents';
import { Users, Clock, DollarSign, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, trend, trendColor }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-5 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between hover:border-brand-900/50 transition-colors">
    {/* Decorative background blur */}
    <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-brand-900/20 rounded-full blur-xl group-hover:bg-brand-900/30 transition-all"></div>
    
    <div className="relative z-10 flex flex-col h-full justify-between gap-2 md:gap-4">
      <div className="flex justify-between items-start">
        <div className="p-1.5 md:p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 shrink-0">
          <Icon size={16} className="md:w-5 md:h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] md:text-xs font-medium ${trendColor} bg-slate-800 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full border border-slate-700 shadow-sm`}>
            <ArrowUpRight size={10} className="md:w-3 md:h-3" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-lg md:text-2xl font-bold text-slate-100 tracking-tight font-sans truncate">{value}</h3>
        <p className="text-[10px] md:text-sm text-slate-500 font-medium leading-tight mt-0.5 md:mt-1 truncate">{label}</p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { employees, attendance, cashAdvances, auditLogs, currentUser } = useApp();

  // 1. Calculate Active Employees
  const activeEmployeesList = employees.filter(e => e.status === 'Active');
  const activeEmployeesCount = activeEmployeesList.length;

  // 2. Calculate Outstanding Cash Advances (Strictly !isPaid)
  const totalKasbon = cashAdvances.filter(c => !c.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

  // Dynamic Chart Data based on last 5 days
  const getChartData = () => {
     const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
     const data = [];
     for(let i=4; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        const count = attendance.filter(a => a.date === dateStr && a.status === 'Present').length;
        data.push({ name: dayName, present: count });
     }
     return data;
  };
  
  const attendanceData = getChartData();

  const formatMoney = (val: number) => {
      if(val > 1000000) {
          return `Rp ${(val/1000000).toFixed(1)}jt`;
      }
      return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const formatTime = (iso: string) => {
      return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Jakarta' });
  };

  const formatDate = (iso: string) => {
      return new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
            Selamat Datang, {currentUser || 'Admin'}
        </h2>
        <p className="text-xs md:text-base text-slate-500 mt-0.5 md:mt-1">Ringkasan aktivitas operasional hari ini (PT. Redone BMU).</p>
      </div>

      {/* Stats Grid - Adjusted to 2 columns specifically for remaining items */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6">
        <StatCard 
          icon={Users} 
          label="Total Karyawan" 
          value={activeEmployeesCount} 
          trend="Active"
          trendColor="text-emerald-400"
        />
        <StatCard 
          icon={DollarSign} 
          label="Kasbon Pending" 
          value={formatMoney(totalKasbon)} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 min-h-[280px] md:min-h-[400px]" title="Statistik Kehadiran">
          <div className="h-48 md:h-80 w-full mt-2 md:mt-4 -ml-4 md:ml-0" style={{ minWidth: 0, minHeight: '12rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.4} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={8}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-5}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                    itemStyle={{ color: '#ef4444' }}
                />
                <Bar 
                  dataKey="present" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]} 
                  barSize={24}
                  activeBar={{ fill: '#dc2626' }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm lg:col-span-1 min-h-[300px] flex flex-col">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 flex justify-between items-center">
             <h3 className="text-base font-semibold text-slate-200 tracking-wide">Log Aktivitas</h3>
             <Link to="/activity-logs" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Lihat Semua
             </Link>
          </div>
          <div className="p-4 md:p-6 flex-1">
            <div className="space-y-0 relative max-h-[300px] md:max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="absolute left-3.5 top-2 bottom-2 w-[1px] bg-slate-800"></div>
              {auditLogs.slice(0, 8).map((log) => {
                  let Icon = Activity;
                  let color = 'text-brand-400';
                  let bg = 'bg-brand-950/30 border-brand-900/50';
                  
                  if (log.action === 'CREATE') { Icon = TrendingUp; color = 'text-emerald-400'; bg = 'bg-emerald-950/30 border-emerald-900/50'; }
                  if (log.action === 'DELETE') { Icon = Clock; color = 'text-rose-400'; bg = 'bg-rose-950/30 border-rose-900/50'; }

                  return (
                      <div key={log.id} className="flex gap-3 md:gap-4 items-start py-3 group relative border-b border-dashed border-slate-800 last:border-0">
                          <div className={`w-8 h-8 rounded-full ${bg} border flex items-center justify-center ${color} text-xs shadow-sm z-10 shrink-0 mt-0.5`}>
                              <Icon size={14} />
                          </div>
                          <div className="pt-0.5 flex-1 min-w-0">
                              <p className="text-xs md:text-sm text-slate-300 font-medium leading-snug break-words">{log.description}</p>
                              <span className="text-[10px] text-slate-500 block mt-1 flex items-center gap-2">
                                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">{formatTime(log.timestamp)}</span>
                                  <span>{formatDate(log.timestamp)}</span>
                              </span>
                          </div>
                      </div>
                  );
              })}
              
              {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">Belum ada aktivitas.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;