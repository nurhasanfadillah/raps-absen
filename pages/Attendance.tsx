import React, { useState } from 'react';
import { useApp } from '../store';
import { useToast } from '../components/Feedback';
import { Button, Input, Select, StatusBadge, Modal } from '../components/UIComponents';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Calendar,
  Edit3,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { AttendanceStatus } from '../types';
import { WORK_START_TIME, HALF_DAY_THRESHOLD_TIME, DEFAULT_CHECK_OUT_TIME } from '../config';

const Attendance: React.FC = () => {
  const { employees, attendance, markAttendance } = useApp();
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({
    status: 'Present' as AttendanceStatus,
    checkInTime: WORK_START_TIME,
    checkOutTime: DEFAULT_CHECK_OUT_TIME,
    overtimeHours: 0,
    notes: '',
  });

  // Handle date change
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getRecord = (empId: string) => {
    return attendance.find((a) => a.employeeId === empId && a.date === selectedDate);
  };

  const openEditModal = (empId: string) => {
    const record = getRecord(empId);
    setSelectedEmployeeId(empId);
    setModalForm({
      status: record?.status || 'Present',
      checkInTime: record?.checkInTime || WORK_START_TIME,
      checkOutTime: record?.checkOutTime || DEFAULT_CHECK_OUT_TIME,
      overtimeHours: record?.overtimeHours || 0,
      notes: record?.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    // Validation
    if (modalForm.overtimeHours < 0) {
      addToast('error', 'Validasi Gagal', 'Jam lembur tidak boleh negatif.');
      return;
    }

    try {
      await markAttendance({
        id: `${selectedEmployeeId}-${selectedDate}`,
        employeeId: selectedEmployeeId,
        date: selectedDate,
        status: modalForm.status,
        checkInTime: modalForm.status === 'Present' ? modalForm.checkInTime : undefined,
        checkOutTime: modalForm.status === 'Present' ? modalForm.checkOutTime : undefined,
        overtimeHours: Number(modalForm.overtimeHours),
        notes: modalForm.notes,
      });
      addToast('success', 'Absensi Tersimpan', 'Data kehadiran berhasil diperbarui.');
      setIsModalOpen(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan absensi.';
      addToast('error', 'Gagal Menyimpan', msg);
    }
  };

  // Helper to determine time status text/color
  const getTimeStatus = (time?: string) => {
    if (!time) return null;
    if (time > HALF_DAY_THRESHOLD_TIME) {
      return { label: 'Potongan (0.5)', color: 'text-rose-400 font-bold', sub: '> 09:00' };
    }
    if (time > WORK_START_TIME) {
      return { label: 'Terlambat', color: 'text-amber-400 font-medium', sub: '> 08:00' };
    }
    return { label: 'Tepat Waktu', color: 'text-emerald-400', sub: '' };
  };

  const activeEmployees = employees.filter((e) => e.status === 'Active');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Absensi Harian</h2>
          <p className="text-sm text-slate-500 mt-1">Pantau kehadiran dan input lembur karyawan</p>
        </div>

        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 shadow-sm">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-1 md:flex-none items-center justify-center gap-2 px-3 py-1.5 bg-slate-950 rounded border border-slate-800">
            <Calendar size={14} className="text-brand-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-sm text-center w-full md:w-28"
            />
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-200 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-slate-800 rounded-xl bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-850 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Karyawan
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Jabatan
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Waktu Masuk
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Jam Lembur
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeEmployees.map((emp) => {
                const record = getRecord(emp.id);
                const status = record?.status || 'Off';
                const timeStatus = status === 'Present' ? getTimeStatus(record?.checkInTime) : null;

                return (
                  <tr key={emp.id} className="hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200 text-sm">{emp.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{emp.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{emp.role}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {status === 'Present' && record?.checkInTime ? (
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-slate-300">{record.checkInTime}</span>
                          {timeStatus && timeStatus.color !== 'text-emerald-400' && (
                            <span className={`text-[10px] ${timeStatus.color}`}>
                              {timeStatus.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-mono text-slate-400">
                      {status === 'Present' && record?.overtimeHours
                        ? `${record.overtimeHours} jam`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        className="ml-auto h-8 text-xs px-3"
                        onClick={() => openEditModal(emp.id)}
                      >
                        <Edit3 size={14} /> Detail / Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile List/Cards */}
      <div className="md:hidden space-y-3">
        {activeEmployees.map((emp) => {
          const record = getRecord(emp.id);
          const status = record?.status || 'Off';
          const timeStatus = status === 'Present' ? getTimeStatus(record?.checkInTime) : null;

          return (
            <div
              key={emp.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-200 text-sm">{emp.fullName}</div>
                  <div className="text-xs text-slate-500">{emp.role}</div>
                </div>
                <StatusBadge status={status} />
              </div>

              {status === 'Present' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 p-2 rounded border border-slate-700 flex flex-col items-center justify-center">
                    <span className="text-slate-500 mb-1">Masuk</span>
                    <span className="font-mono font-medium text-sm text-slate-300">
                      {record?.checkInTime || '-'}
                    </span>
                    {timeStatus && timeStatus.color !== 'text-emerald-400' && (
                      <span className={`text-[10px] ${timeStatus.color} mt-0.5`}>
                        {timeStatus.label}
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700 flex flex-col items-center justify-center">
                    <span className="text-slate-500 mb-1">Lembur</span>
                    <div className="flex items-center gap-1">
                      <Clock
                        size={12}
                        className={record?.overtimeHours ? 'text-amber-400' : 'text-slate-500'}
                      />
                      <span className="font-mono font-medium text-sm text-slate-300">
                        {record?.overtimeHours || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {record?.notes && (
                <div className="text-xs text-slate-400 bg-slate-800 p-2 rounded border border-slate-700 italic">
                  "{record.notes}"
                </div>
              )}

              <Button
                variant="secondary"
                className="w-full text-xs h-9"
                onClick={() => openEditModal(emp.id)}
              >
                <Edit3 size={14} /> Update Absensi
              </Button>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update Absensi & Lembur"
      >
        <form onSubmit={handleSaveModal} className="space-y-5">
          <Select
            label="Status Kehadiran"
            value={modalForm.status}
            onChange={(e) =>
              setModalForm({ ...modalForm, status: e.target.value as AttendanceStatus })
            }
          >
            <option value="Present">Hadir</option>
            <option value="Sick">Sakit</option>
            <option value="Permission">Izin</option>
            <option value="Alpha">Alpa</option>
            <option value="Off">Libur/Off</option>
          </Select>

          {modalForm.status === 'Present' && (
            <>
              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="Jam Masuk"
                  type="time"
                  value={modalForm.checkInTime}
                  onChange={(e) => setModalForm({ ...modalForm, checkInTime: e.target.value })}
                />
                <Input
                  label="Jam Keluar"
                  type="time"
                  value={modalForm.checkOutTime}
                  onChange={(e) => setModalForm({ ...modalForm, checkOutTime: e.target.value })}
                />
              </div>

              {/* Visual Guide for Admin */}
              {modalForm.checkInTime > HALF_DAY_THRESHOLD_TIME ? (
                <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-900/50 flex gap-2 items-start">
                  <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={14} />
                  <div className="text-xs text-rose-300">
                    <strong>Peringatan Potongan:</strong> Jam masuk lewat dari{' '}
                    {HALF_DAY_THRESHOLD_TIME}. Sistem akan menghitung kehadiran ini sebagai{' '}
                    <strong>0.5 Hari</strong>.
                  </div>
                </div>
              ) : modalForm.checkInTime > WORK_START_TIME ? (
                <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-900/50 flex gap-2 items-start">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                  <div className="text-xs text-amber-300">
                    <strong>Terlambat:</strong> Jam masuk lewat dari {WORK_START_TIME}. Tetap
                    dihitung 1 Hari (Full) namun tercatat terlambat.
                  </div>
                </div>
              ) : null}
            </>
          )}

          <div className="bg-brand-950/30 p-4 rounded-lg border border-brand-900/50">
            <Input
              label="Input Jam Lembur (Jam)"
              type="number"
              min="0"
              step="0.5"
              value={modalForm.overtimeHours}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0) setModalForm({ ...modalForm, overtimeHours: val });
              }}
              placeholder="Contoh: 2"
            />
            <p className="text-[10px] text-brand-400 mt-2">
              * Total nilai lembur akan dihitung otomatis saat penggajian berdasarkan tarif lembur
              karyawan ini.
            </p>
          </div>

          <Input
            label="Catatan"
            value={modalForm.notes}
            onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
            placeholder="Keterangan tambahan..."
          />

          <div className="pt-6 flex justify-end gap-3 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              <Save size={16} /> Simpan Data
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;
