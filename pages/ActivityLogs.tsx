import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { Card, Button } from '../components/UIComponents';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  FileText,
  Database,
  Lock,
  Calendar,
} from 'lucide-react';
import { ActionType } from '../types';
import { formatJakartaTime } from '../utils/format-date';

const ActivityLogs: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // --- Filtering Logic ---
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = filterAction === 'ALL' || log.action === filterAction;
      const matchesEntity = filterEntity === 'ALL' || log.entity === filterEntity;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [auditLogs, searchTerm, filterAction, filterEntity]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentData = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- UI Helpers ---
  const getActionBadge = (action: ActionType) => {
    const styles = {
      CREATE: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50',
      UPDATE: 'bg-brand-950/40 text-brand-400 border-brand-900/50',
      DELETE: 'bg-rose-950/40 text-rose-400 border-rose-900/50',
      AUTH: 'bg-violet-950/40 text-violet-400 border-violet-900/50',
      SYSTEM: 'bg-slate-800 text-slate-400 border-slate-700',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[action] || styles.SYSTEM}`}
      >
        {action}
      </span>
    );
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'Employee':
        return <User size={14} />;
      case 'Payroll':
        return <FileText size={14} />;
      case 'Auth':
        return <Lock size={14} />;
      case 'Attendance':
        return <Calendar size={14} />;
      default:
        return <Database size={14} />;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="text-brand-500" /> Log Aktivitas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Rekaman jejak audit sistem untuk keamanan dan pemantauan (WIB / UTC+7).
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Cari deskripsi, user, atau ID log..."
              className="w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition-all placeholder:text-slate-600 shadow-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-3 text-slate-500" size={16} />
              <select
                className="w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 appearance-none focus:outline-none focus:border-brand-500 text-sm shadow-sm"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Semua Aksi</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="AUTH">Auth</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
          </div>
          <div className="w-full md:w-48">
            <div className="relative">
              <Database className="absolute left-3 top-3 text-slate-500" size={16} />
              <select
                className="w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 appearance-none focus:outline-none focus:border-brand-500 text-sm shadow-sm"
                value={filterEntity}
                onChange={(e) => {
                  setFilterEntity(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Semua Modul</option>
                <option value="Employee">Karyawan</option>
                <option value="Attendance">Absensi</option>
                <option value="CashAdvance">Kasbon</option>
                <option value="Payroll">Penggajian</option>
                <option value="Auth">Keamanan</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      <div className="space-y-4">
        {/* Desktop Table */}
        <div className="hidden md:block border border-slate-800 rounded-xl bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-850 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-48">
                  Waktu (WIB)
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">
                  Aksi
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">
                  Modul
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Deskripsi Aktivitas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentData.map((log) => {
                return (
                  <tr key={log.id} className="hover:bg-slate-800 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300 font-mono">{formatJakartaTime(log.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold border border-slate-700">
                          {log.user.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-300">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        {getEntityIcon(log.entity)}
                        <span>{log.entity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-200 leading-relaxed">{log.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                        ID: {log.id}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Tidak ada log aktivitas yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-3">
          {currentData.map((log) => {
            return (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
                <div className="flex justify-between items-start mb-2 pl-3">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      {getEntityIcon(log.entity)} {log.entity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{formatJakartaTime(log.timestamp)}</div>
                </div>
                <div className="pl-3 mb-2">
                  <p className="text-sm text-slate-200 leading-snug">{log.description}</p>
                </div>
                <div className="pl-3 flex justify-between items-center border-t border-slate-800 pt-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-slate-400 font-bold">
                      {log.user.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-500">{log.user}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {currentData.length === 0 && (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Tidak ada log aktivitas yang ditemukan.
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-slate-500">
              Menampilkan{' '}
              <span className="font-medium text-slate-200">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              -{' '}
              <span className="font-medium text-slate-200">
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </span>{' '}
              dari <span className="font-medium text-slate-200">{filteredLogs.length}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="h-9 px-3"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                className="h-9 px-3"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
