import type { Dispatch, SetStateAction } from 'react';
import type { Employee, AttendanceRecord, CashAdvance, PayrollReport, ActionType } from '../types';
import { supabase } from '../lib/supabase';
import { HALF_DAY_THRESHOLD_TIME } from '../config';

interface PayrollActionDeps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  cashAdvances: CashAdvance[];
  payrollReports: PayrollReport[];
  setPayrollReports: Dispatch<SetStateAction<PayrollReport[]>>;
  setCashAdvances: Dispatch<SetStateAction<CashAdvance[]>>;
  addAuditLog: (action: ActionType, entity: string, description: string) => Promise<void>;
}

export function createPayrollActions(deps: PayrollActionDeps) {
  const {
    employees,
    attendance,
    cashAdvances,
    payrollReports,
    setPayrollReports,
    setCashAdvances,
    addAuditLog,
  } = deps;

  const generatePayroll = (start: string, end: string): PayrollReport => {
    const items = employees
      .filter((e) => e.status === 'Active')
      .map((emp) => {
        const empAttendance = attendance.filter(
          (a) =>
            a.employeeId === emp.id && a.date >= start && a.date <= end && a.status === 'Present'
        );

        const totalPresence = empAttendance.length;
        let totalFullDays = 0;
        let totalHalfDays = 0;

        empAttendance.forEach((record) => {
          if (record.checkInTime) {
            if (record.checkInTime <= HALF_DAY_THRESHOLD_TIME) {
              totalFullDays += 1;
            } else {
              totalHalfDays += 1;
            }
          } else {
            totalFullDays += 1;
          }
        });

        const totalEffectiveDays = totalFullDays + totalHalfDays * 0.5;
        const totalBasePay = totalEffectiveDays * emp.baseSalary;

        const totalOvertimeHours = empAttendance.reduce((sum, record) => {
          return sum + (record.overtimeHours || 0);
        }, 0);

        const overtimeRate = emp.overtimeRate || 0;
        const totalOvertimePay = totalOvertimeHours * overtimeRate;

        const unpaidAdvances = cashAdvances.filter(
          (ca) => ca.employeeId === emp.id && !ca.isPaid && ca.date <= end
        );

        const totalDeductions = unpaidAdvances.reduce((sum, ca) => sum + ca.amount, 0);
        const deductionIds = unpaidAdvances.map((ca) => ca.id);

        const netSalary = totalBasePay + totalOvertimePay - totalDeductions;

        return {
          employeeId: emp.id,
          employeeName: emp.fullName,
          role: emp.role,
          baseSalary: emp.baseSalary,
          totalPresence,
          totalFullDays,
          totalHalfDays,
          totalEffectiveDays,
          totalBasePay,
          totalOvertimeHours,
          overtimeRate,
          totalOvertimePay,
          totalDeductions,
          deductionIds,
          netSalary,
          periodStart: start,
          periodEnd: end,
        };
      });

    const report: PayrollReport = {
      id: `PAY-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      periodStart: start,
      periodEnd: end,
      items,
      totalPayout: items.reduce((sum, item) => sum + item.netSalary, 0),
      status: 'Draft',
      isDeleted: false,
    };

    return report;
  };

  const savePayrollReport = async (report: PayrollReport) => {
    const finalReport = { ...report, status: 'Final' as const };

    const { error } = await supabase.rpc('save_payroll_transaction', {
      p_report_id: finalReport.id,
      p_period_start: finalReport.periodStart,
      p_period_end: finalReport.periodEnd,
      p_total_payout: finalReport.totalPayout,
      p_generated_at: finalReport.generatedAt,
      p_items: finalReport.items,
    });

    if (error) {
      console.error(error);
      throw new Error('Failed to save payroll report: ' + error.message);
    }

    const { data: caData } = await supabase.from('cash_advances').select('*');
    if (caData) {
      setCashAdvances(
        caData.map((c: any) => ({
          id: c.id,
          employeeId: c.employee_id,
          amount: c.amount,
          date: c.date,
          reason: c.reason,
          isPaid: c.is_paid,
          deductedInPayrollId: c.deducted_in_payroll_id,
          createdAt: c.created_at,
        }))
      );
    }

    await addAuditLog(
      'CREATE',
      'Payroll',
      `Generated & Saved Payroll Report for period ${report.periodStart} - ${report.periodEnd}`
    );
    setPayrollReports((prev) => [...prev, finalReport]);
  };

  const deletePayrollReport = async (id: string) => {
    const relatedAdvances = cashAdvances.filter((ca) => ca.deductedInPayrollId === id);

    for (const ca of relatedAdvances) {
      await supabase
        .from('cash_advances')
        .update({ is_paid: false, deducted_in_payroll_id: null })
        .eq('id', ca.id);
    }

    const { error } = await supabase
      .from('payroll_reports')
      .update({ is_deleted: true })
      .eq('id', id);
    if (error) throw new Error(error.message);

    setCashAdvances((prev) =>
      prev.map((c) =>
        c.deductedInPayrollId === id ? { ...c, isPaid: false, deductedInPayrollId: undefined } : c
      )
    );

    const updatedReport = payrollReports.find((p) => p.id === id);
    if (updatedReport) {
      setPayrollReports((prev) => prev.map((p) => (p.id === id ? { ...p, isDeleted: true } : p)));
    }

    await addAuditLog(
      'DELETE',
      'Payroll',
      `Soft deleted payroll report ${id} and reverted associated deductions.`
    );
  };

  return { generatePayroll, savePayrollReport, deletePayrollReport };
}
