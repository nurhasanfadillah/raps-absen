import React, { useState } from 'react';
import { useApp } from '../store';
import { useConfirm, useToast } from '../components/Feedback';
import { Card, Button, Input } from '../components/UIComponents';
import { FileText, Printer, Calculator, Save, CheckCircle2, History, Trash2, CalendarDays, Coins } from 'lucide-react';
import { PayrollReport } from '../types';
import { generateReportPDF, generatePayslipPDF } from '../services/pdfService';

const Payroll: React.FC = () => {
  const { generatePayroll, savePayrollReport, payrollReports, deletePayrollReport } = useApp();
  const { confirm } = useConfirm();
  const { addToast } = useToast();
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [report, setReport] = useState<PayrollReport | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = () => {
    if (!periodStart || !periodEnd) {
        addToast('warning', 'Periode Belum Lengkap', 'Silakan pilih tanggal mulai dan selesai.');
        return;
    }
    const result = generatePayroll(periodStart, periodEnd);
    if (result.items.length === 0) {
        addToast('info', 'Data Kosong', 'Tidak ada data karyawan aktif untuk periode tersebut.');
    } else {
        addToast('success', 'Perhitungan Selesai', `Berhasil menghitung gaji untuk ${result.items.length} karyawan.`);
    }
    setReport(result);
  };

  const handleSave = () => {
    if (!report) return;
    
    confirm({
        title: 'Finalisasi Penggajian',
        message: 'Laporan ini akan disimpan sebagai FINAL. Status kasbon karyawan yang dipotong akan otomatis ditandai LUNAS. Lanjutkan?',
        variant: 'info',
        confirmText: 'Simpan & Finalisasi',
        onConfirm: async () => {
            setIsSaving(true);
            try {
                await savePayrollReport(report);
                addToast('success', 'Laporan Disimpan', 'Penggajian berhasil difinalisasi dan disimpan.');
                setReport(null);
                setPeriodStart('');
                setPeriodEnd('');
                setActiveTab('history');
            } catch (e) {
                addToast('error', 'Gagal', 'Terjadi kesalahan saat menyimpan laporan.');
            } finally {
                setIsSaving(false);
            }
        }
    });
  };

  const handleDeleteHistory = (id: string, period: string) => {
      confirm({
          title: 'Hapus Laporan?',
          message: (
            <span>
                Menghapus laporan periode <strong>{period}</strong> akan <strong>membatalkan status pembayaran Kasbon</strong> yang terkait (rollback). 
                Laporan akan dipindahkan ke arsip sampah (Soft Delete).
            </span>
          ),
          variant: 'danger',
          confirmText: 'Ya, Hapus & Rollback',
          onConfirm: async () => {
            try {
                await deletePayrollReport(id);
                addToast('success', 'Laporan Dihapus', 'Laporan berhasil dihapus dan status kasbon telah dikembalikan.');
            } catch (e) {
                addToast('error', 'Gagal', 'Gagal menghapus laporan.');
            }
          }
      });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // Filter out soft-deleted reports
  const visibleReports = payrollReports.filter(r => !r.isDeleted);

  return (
    <div className="space-y-6">
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'create' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
              Buat Penggajian Baru
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
              Riwayat Laporan
          </button>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-1">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm sticky top-24">
                    <h3 className="text-lg font-bold text-slate-100 mb-2">Parameter Gaji</h3>
                    <p className="text-sm text-slate-500 mb-6">Pilih periode tanggal untuk menghitung gaji (Sistem Gaji Harian), lembur, dan potongan.</p>
                    
                    <div className="space-y-4">
                        <Input 
                            label="Periode Mulai" 
                            type="date" 
                            value={periodStart} 
                            onChange={e => setPeriodStart(e.target.value)} 
                        />
                        <Input 
                            label="Periode Selesai" 
                            type="date" 
                            value={periodEnd} 
                            onChange={e => setPeriodEnd(e.target.value)} 
                        />
                        <div className="pt-2">
                            <Button 
                                onClick={handleGenerate} 
                                disabled={!periodStart || !periodEnd} 
                                className="w-full h-10"
                            >
                                <Calculator size={16} /> 
                                Hitung Gaji
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                {!report ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50 text-slate-500 p-8 text-center">
                        <Calculator size={48} className="mb-4 opacity-30" />
                        <p>Pilih periode dan klik tombol hitung untuk melihat pratinjau.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-950/20 border border-brand-900/50 p-4 rounded-xl">
                            <div>
                                <h2 className="text-lg font-semibold text-brand-300">Draft Pratinjau</h2>
                                <p className="text-sm text-brand-400/70">Periode: {report.periodStart} s.d. {report.periodEnd}</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button onClick={handleSave} isLoading={isSaving} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/40">
                                    <Save size={16} /> <span className="sm:hidden">Finalisasi</span><span className="hidden sm:inline">Simpan & Finalisasi</span>
                                </Button>
                            </div>
                        </div>

                        <ReportTable report={report} formatMoney={formatMoney} isPreview={true} />
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
             {visibleReports.length === 0 ? (
                 <div className="py-12 text-center text-slate-500">Belum ada riwayat penggajian yang aktif.</div>
             ) : (
                 visibleReports.slice().reverse().map(rep => (
                     <Card key={rep.id} title={`Laporan: ${rep.periodStart} s/d ${rep.periodEnd}`} className="overflow-hidden">
                         <div className="mb-4 flex flex-col md:flex-row justify-between md:items-center px-4 md:px-6 pt-2 gap-4">
                             <div className="text-sm text-slate-500">
                                Dibuat pada: {new Date(rep.generatedAt).toLocaleString('id-ID')}
                             </div>
                             <div className="flex gap-2">
                                <Button onClick={() => handleDeleteHistory(rep.id, `${rep.periodStart} - ${rep.periodEnd}`)} variant="danger" className="h-9 md:h-8 text-xs px-3 md:px-2 flex-1 md:flex-none">
                                    <Trash2 size={14} /> Hapus
                                </Button>
                                <Button onClick={() => generateReportPDF(rep)} variant="secondary" className="h-9 md:h-8 text-xs flex-1 md:flex-none">
                                    <Printer size={14} /> <span className="md:hidden">Cetak</span><span className="hidden md:inline">Cetak PDF</span>
                                </Button>
                             </div>
                         </div>
                         <div className="px-0 md:px-6 pb-6">
                            <ReportTable report={rep} formatMoney={formatMoney} isPreview={false} />
                         </div>
                     </Card>
                 ))
             )}
        </div>
      )}
    </div>
  );
};

// Sub-component for table/card list
const ReportTable = ({ report, formatMoney, isPreview }: { report: PayrollReport, formatMoney: (n: number) => string, isPreview: boolean }) => (
    <>
        {/* Desktop View */}
        <div className="hidden md:block border border-slate-800 rounded-xl bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                <tr className="bg-slate-850 border-b border-slate-800">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Karyawan</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-center">Efektif</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Gaji Dasar</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Lembur</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Potongan</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Net</th>
                    {!isPreview && <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-center">Slip</th>}
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                {report.items.map(item => (
                    <tr key={item.employeeId} className="hover:bg-slate-800 transition-colors">
                    <td className="px-5 py-3">
                        <div className="font-medium text-slate-200 text-sm">{item.employeeName}</div>
                        <div className="text-xs text-slate-500">{item.role}</div>
                    </td>
                    <td className="px-5 py-3 text-center">
                        <div className="text-sm text-brand-400 font-bold">{item.totalEffectiveDays}</div>
                        <div className="text-[10px] text-slate-500">
                            (F:{item.totalFullDays}, H:{item.totalHalfDays})
                        </div>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-mono text-slate-400">
                        {formatMoney(item.totalBasePay)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-mono text-emerald-400">
                        {item.totalOvertimePay > 0 ? formatMoney(item.totalOvertimePay) : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-mono text-rose-400">
                        {item.totalDeductions > 0 ? `-${formatMoney(item.totalDeductions)}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-100 text-sm">{formatMoney(item.netSalary)}</td>
                    {!isPreview && (
                        <td className="px-5 py-3 text-center">
                            <button 
                                onClick={() => generatePayslipPDF(item, report)}
                                className="p-1.5 hover:bg-brand-950/30 rounded-md text-brand-400 transition-colors"
                                title="Cetak Slip Gaji"
                            >
                                <FileText size={16} />
                            </button>
                        </td>
                    )}
                    </tr>
                ))}
                </tbody>
                <tfoot className="bg-slate-850/80 border-t border-slate-800 backdrop-blur-sm">
                <tr>
                    <td colSpan={5} className="px-5 py-4 text-right text-sm font-bold text-slate-400 uppercase tracking-wide">Total Pembayaran</td>
                    <td className="px-5 py-4 text-right font-bold font-mono text-lg text-slate-100">{formatMoney(report.totalPayout)}</td>
                    {!isPreview && <td></td>}
                </tr>
                </tfoot>
            </table>
            </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
            {report.items.map(item => (
                <div key={item.employeeId} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative">
                    <div className="flex justify-between items-start mb-3 border-b border-slate-800 pb-3">
                        <div>
                            <h4 className="font-semibold text-slate-200">{item.employeeName}</h4>
                            <div className="text-xs text-slate-500">{item.role}</div>
                        </div>
                        {!isPreview && (
                             <button 
                                onClick={() => generatePayslipPDF(item, report)}
                                className="p-2 bg-brand-950/30 rounded-lg text-brand-400 hover:bg-brand-900/50"
                            >
                                <FileText size={16} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="text-slate-500 block mb-1">Gaji Dasar</span>
                            <span className="font-mono text-slate-300">{formatMoney(item.totalBasePay)}</span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{item.totalEffectiveDays} Hari Efektif</div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="text-slate-500 block mb-1">Lembur</span>
                            <span className="font-mono text-emerald-400">{formatMoney(item.totalOvertimePay)}</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                            <span className="text-slate-500 block mb-1">Potongan</span>
                            <span className="font-mono text-rose-400">{item.totalDeductions > 0 ? `-${formatMoney(item.totalDeductions)}` : '-'}</span>
                        </div>
                        <div className="bg-brand-950/30 p-2 rounded border border-brand-900/50 col-span-1">
                            <span className="text-brand-400 block mb-1 font-bold">Total Bersih</span>
                            <span className="font-mono text-brand-300 font-bold">{formatMoney(item.netSalary)}</span>
                        </div>
                    </div>
                </div>
            ))}
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center sticky bottom-0 z-10 shadow-xl">
                 <span className="text-xs font-bold text-slate-400 uppercase">Total Payout</span>
                 <span className="font-bold font-mono text-lg text-slate-100">{formatMoney(report.totalPayout)}</span>
            </div>
        </div>
    </>
);

export default Payroll;