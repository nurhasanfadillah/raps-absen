import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Employee, AttendanceRecord, CashAdvance, PayrollReport, AuditLog } from '../types';
import { supabase } from '../lib/supabase';
import type { AppContextType } from './types';
import { createAuditActions } from './audit-actions';
import { createAuthActions, loadSession } from './auth-actions';
import { createEmployeeActions } from './employee-actions';
import { createAttendanceActions } from './attendance-actions';
import { createCashAdvanceActions } from './cashadvance-actions';
import { createPayrollActions } from './payroll-actions';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        await loadData();

        const sessionUser = loadSession();
        if (sessionUser) {
          setIsAuthenticated(true);
          setCurrentUser(sessionUser);
        }
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };
    setup();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // 1. Employees
    const { data: empData } = await supabase.from('employees').select('*').is('deleted_at', null);
    if (empData) {
      setEmployees(
        empData.map((e: any) => ({
          id: e.id,
          fullName: e.full_name,
          role: e.role,
          baseSalary: e.base_salary,
          overtimeRate: e.overtime_rate,
          joinDate: e.join_date,
          status: e.status,
          phone: e.phone,
          email: e.email,
          createdAt: e.created_at,
        }))
      );
    }

    // 2. Attendance
    const { data: attData } = await supabase.from('attendance').select('*');
    if (attData) {
      setAttendance(
        attData.map((a: any) => ({
          id: a.id,
          employeeId: a.employee_id,
          date: a.date,
          status: a.status,
          checkInTime: a.check_in_time,
          checkOutTime: a.check_out_time,
          overtimeHours: a.overtime_hours,
          notes: a.notes,
          updatedAt: a.updated_at,
        }))
      );
    }

    // 3. Cash Advances
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

    // 4. Payroll Reports & Items
    const { data: prData } = await supabase
      .from('payroll_reports')
      .select('*')
      .eq('is_deleted', false);
    if (prData) {
      const reports: PayrollReport[] = [];
      const { data: piData } = await supabase.from('payroll_items').select('*');

      prData.forEach((p: any) => {
        const items =
          piData
            ?.filter((i: any) => i.payroll_report_id === p.id)
            .map((i: any) => ({
              id: i.id,
              payrollReportId: i.payroll_report_id,
              employeeId: i.employee_id,
              employeeName: i.employee_name,
              role: i.role,
              baseSalary: i.base_salary,
              totalPresence: i.total_presence,
              totalFullDays: i.total_full_days,
              totalHalfDays: i.total_half_days,
              totalEffectiveDays: i.total_effective_days,
              totalBasePay: i.total_base_pay,
              totalOvertimeHours: i.total_overtime_hours,
              overtimeRate: i.overtime_rate,
              totalOvertimePay: i.total_overtime_pay,
              totalDeductions: i.total_deductions,
              netSalary: i.net_salary,
              deductionIds: i.deduction_ids,
              periodStart: p.period_start,
              periodEnd: p.period_end,
            })) || [];

        reports.push({
          id: p.id,
          periodStart: p.period_start,
          periodEnd: p.period_end,
          totalPayout: p.total_payout,
          status: p.status,
          generatedAt: p.generated_at,
          isDeleted: p.is_deleted,
          items,
        });
      });
      setPayrollReports(reports);
    }

    // 5. Audit Logs
    const { data: logData } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (logData) {
      setAuditLogs(
        logData.map((l: any) => ({
          id: l.id,
          timestamp: l.timestamp,
          action: l.action,
          entity: l.entity,
          description: l.description,
          user: l.user_name || 'Unknown',
        }))
      );
    }

    setIsLoading(false);
  };

  // Compose action factories — recreated each render with latest state
  const { addAuditLog } = createAuditActions({ currentUser, setAuditLogs });

  const { login, logout, updateCredentials, resetCredentials } = createAuthActions({
    currentUser,
    setIsAuthenticated,
    setCurrentUser,
    addAuditLog,
  });

  const { addEmployee, updateEmployee, deleteEmployee } = createEmployeeActions({
    employees,
    attendance,
    cashAdvances,
    payrollReports,
    setEmployees,
    addAuditLog,
  });

  const { markAttendance, getAttendanceByDate } = createAttendanceActions({
    attendance,
    setAttendance,
    addAuditLog,
  });

  const { addCashAdvance, updateCashAdvance, deleteCashAdvance, markCashAdvancePaid } =
    createCashAdvanceActions({
      employees,
      cashAdvances,
      setCashAdvances,
      addAuditLog,
    });

  const { generatePayroll, savePayrollReport, deletePayrollReport } = createPayrollActions({
    employees,
    attendance,
    cashAdvances,
    payrollReports,
    setPayrollReports,
    setCashAdvances,
    addAuditLog,
  });

  return (
    <AppContext.Provider
      value={{
        employees,
        attendance,
        cashAdvances,
        payrollReports,
        auditLogs,
        isLoading,
        isAuthenticated,
        currentUser,
        login,
        logout,
        updateCredentials,
        resetCredentials,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        markAttendance,
        getAttendanceByDate,
        addCashAdvance,
        updateCashAdvance,
        deleteCashAdvance,
        markCashAdvancePaid,
        generatePayroll,
        savePayrollReport,
        deletePayrollReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
