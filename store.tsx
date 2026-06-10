
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Employee, AttendanceRecord, CashAdvance, PayrollReport, PayrollItem, AuditLog, ActionType, AuthCreds } from './types';
import { supabase } from './lib/supabase';
import { HALF_DAY_THRESHOLD_TIME } from './config';

interface AppContextType {
  employees: Employee[];
  attendance: AttendanceRecord[];
  cashAdvances: CashAdvance[];
  payrollReports: PayrollReport[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  
  // Auth State
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCredentials: (oldP: string, newU: string, newP: string) => Promise<void>;
  resetCredentials: (code: string) => Promise<boolean>;

  // Actions
  addEmployee: (emp: Employee) => Promise<void>;
  updateEmployee: (emp: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  markAttendance: (record: AttendanceRecord) => Promise<void>;
  getAttendanceByDate: (date: string) => AttendanceRecord[];
  
  addCashAdvance: (ca: CashAdvance) => Promise<void>;
  updateCashAdvance: (ca: CashAdvance) => Promise<void>;
  deleteCashAdvance: (id: string) => Promise<void>;
  markCashAdvancePaid: (id: string) => Promise<void>;
  
  generatePayroll: (start: string, end: string) => PayrollReport;
  savePayrollReport: (report: PayrollReport) => Promise<void>;
  deletePayrollReport: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Hashing Utility
const hashPassword = async (password: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Auth State
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Initialize & Load Data from Supabase
  useEffect(() => {
    const setup = async () => {
      try {
        await loadData();
        
        // Check session
        const sessionUser = sessionStorage.getItem('raps_user');
        if (sessionUser) {
            setIsAuthenticated(true);
            setCurrentUser(sessionUser);
        }
      } catch (error) {
        console.error("Failed to load data from Supabase:", error);
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
        setEmployees(empData.map((e: any) => ({
            id: e.id,
            fullName: e.full_name,
            role: e.role,
            baseSalary: e.base_salary,
            overtimeRate: e.overtime_rate,
            joinDate: e.join_date,
            status: e.status,
            phone: e.phone,
            email: e.email,
            createdAt: e.created_at
        })));
    }

    // 2. Attendance
    const { data: attData } = await supabase.from('attendance').select('*');
    if (attData) {
        setAttendance(attData.map((a: any) => ({
            id: a.id,
            employeeId: a.employee_id,
            date: a.date,
            status: a.status,
            checkInTime: a.check_in_time,
            checkOutTime: a.check_out_time,
            overtimeHours: a.overtime_hours,
            notes: a.notes,
            updatedAt: a.updated_at
        })));
    }

    // 3. Cash Advances
    const { data: caData } = await supabase.from('cash_advances').select('*');
    if (caData) {
        setCashAdvances(caData.map((c: any) => ({
            id: c.id,
            employeeId: c.employee_id,
            amount: c.amount,
            date: c.date,
            reason: c.reason,
            isPaid: c.is_paid,
            deductedInPayrollId: c.deducted_in_payroll_id,
            createdAt: c.created_at
        })));
    }

    // 4. Payroll Reports & Items
    // Supabase can join, but separate fetch is often simpler for mapping custom objects
    const { data: prData } = await supabase.from('payroll_reports').select('*').is('is_deleted', false);
    if (prData) {
        const reports: PayrollReport[] = [];
        // Fetch all items for simplicity (or fetch on demand, but app loads all now)
        const { data: piData } = await supabase.from('payroll_items').select('*');
        
        prData.forEach((p: any) => {
            const items = piData?.filter((i: any) => i.payroll_report_id === p.id).map((i: any) => ({
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
                periodEnd: p.period_end
            })) || [];

            reports.push({
                id: p.id,
                periodStart: p.period_start,
                periodEnd: p.period_end,
                totalPayout: p.total_payout,
                status: p.status,
                generatedAt: p.generated_at,
                isDeleted: p.is_deleted,
                items: items
            });
        });
        setPayrollReports(reports);
    }

    // 5. Audit Logs
    const { data: logData } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if (logData) {
        setAuditLogs(logData.map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            action: l.action,
            entity: l.entity,
            description: l.description,
            user: l.user_name || 'Unknown'
        })));
    }
    
    setIsLoading(false);
  };

  const addAuditLog = async (action: ActionType, entity: string, description: string) => {
    const log = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      description,
      user_name: currentUser || 'System'
    };
    
    await supabase.from('audit_logs').insert(log);
    
    // Optimistic Update
    setAuditLogs(prev => [ { ...log, user: log.user_name } as AuditLog, ...prev ]);
  };

  // --- Auth Actions ---

  const login = async (username: string, password: string): Promise<boolean> => {
      // For this localized version, we store admin creds in 'app_config' table as JSON
      const { data } = await supabase.from('app_config').select('value').eq('key', 'auth_admin').single();
      
      if (!data) return false;
      const creds = data.value;

      const inputHash = await hashPassword(password);
      if (creds.username === username && creds.passwordHash === inputHash) {
          setIsAuthenticated(true);
          setCurrentUser(username);
          sessionStorage.setItem('raps_user', username);
          await addAuditLog('AUTH', 'Auth', `User logged in: ${username}`);
          return true;
      }
      return false;
  };

  const logout = async () => {
      if (currentUser) {
          await addAuditLog('AUTH', 'Auth', `User logged out: ${currentUser}`);
      }
      setIsAuthenticated(false);
      setCurrentUser(null);
      sessionStorage.removeItem('raps_user');
  };

  const updateCredentials = async (oldP: string, newU: string, newP: string) => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'auth_admin').single();
      const creds = data?.value;
      const oldHash = await hashPassword(oldP);
      
      if (creds.passwordHash !== oldHash) {
          throw new Error("Password lama salah.");
      }
      
      if (newP.length < 5) {
          throw new Error("Password baru minimal 5 karakter.");
      }

      const newHash = await hashPassword(newP);
      
      await supabase.from('app_config').update({
          value: { username: newU, passwordHash: newHash }
      }).eq('key', 'auth_admin');

      await addAuditLog('AUTH', 'Auth', `Credentials updated for admin.`);
      setCurrentUser(newU);
      sessionStorage.setItem('raps_user', newU);
  };

  const resetCredentials = async (code: string): Promise<boolean> => {
      // Hardcoded secret for demo purposes
      if (code === '301292') {
          const defaultHash = await hashPassword('admin');
          await supabase.from('app_config').update({
              value: { username: 'admin', passwordHash: defaultHash }
          }).eq('key', 'auth_admin');

          await addAuditLog('AUTH', 'Auth', `EMERGENCY RESET: Credentials reset to default.`);
          return true;
      }
      return false;
  };

  // --- Data Actions ---

  const addEmployee = async (emp: Employee) => {
    const dbEmp = {
        id: emp.id,
        full_name: emp.fullName,
        role: emp.role,
        base_salary: emp.baseSalary,
        overtime_rate: emp.overtimeRate,
        join_date: emp.joinDate,
        status: emp.status,
        phone: emp.phone,
        email: emp.email,
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('employees').insert(dbEmp);
    if (error) throw new Error(error.message);

    await addAuditLog('CREATE', 'Employee', `Added new employee: ${emp.fullName}`);
    setEmployees(prev => [...prev, { ...emp, createdAt: dbEmp.created_at }]);
  };
  
  const updateEmployee = async (emp: Employee) => {
    const dbEmp = {
        full_name: emp.fullName,
        role: emp.role,
        base_salary: emp.baseSalary,
        overtime_rate: emp.overtimeRate,
        join_date: emp.joinDate,
        status: emp.status,
        phone: emp.phone,
        email: emp.email
    };

    const { error } = await supabase.from('employees').update(dbEmp).eq('id', emp.id);
    if (error) throw new Error(error.message);

    await addAuditLog('UPDATE', 'Employee', `Updated employee details: ${emp.fullName}`);
    setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
  };

  const deleteEmployee = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    // STRICT VALIDATION
    const hasAttendance = attendance.some(a => a.employeeId === id);
    const hasCashAdvance = cashAdvances.some(c => c.employeeId === id);
    const hasPayrollHistory = payrollReports.some(p => 
        !p.isDeleted && p.items.some(i => i.employeeId === id)
    );

    if (hasAttendance || hasCashAdvance || hasPayrollHistory) {
        const errorMsg = "Karyawan memiliki riwayat transaksi. Hard Delete ditolak. Silahkan ubah status menjadi Non-Aktif.";
        await addAuditLog('SYSTEM', 'Employee', `Failed attempt to delete employee ${emp.fullName}: Linked data exists.`);
        throw new Error(errorMsg);
    }

    // Perform Soft Delete
    const { error } = await supabase.from('employees').update({ deleted_at: new Date().toISOString(), status: 'Inactive' }).eq('id', id);
    if (error) throw new Error(error.message);

    await addAuditLog('DELETE', 'Employee', `Soft deleted employee: ${emp.fullName}`);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const markAttendance = async (record: AttendanceRecord) => {
    // Check if updating or creating
    const existing = attendance.find(a => a.employeeId === record.employeeId && a.date === record.date);
    const action = existing ? 'UPDATE' : 'CREATE';
    
    const dbRecord = {
        id: record.id,
        employee_id: record.employeeId,
        date: record.date,
        status: record.status,
        check_in_time: record.checkInTime || null,
        check_out_time: record.checkOutTime || null,
        overtime_hours: record.overtimeHours || 0,
        notes: record.notes
    };

    const { error } = await supabase.from('attendance').upsert(dbRecord);
    if (error) throw new Error(error.message);

    setAttendance(prev => {
       const filtered = prev.filter(a => !(a.employeeId === record.employeeId && a.date === record.date));
       return [...filtered, record];
    });

    if (action === 'CREATE') {
        await addAuditLog('CREATE', 'Attendance', `Marked attendance for ${record.employeeId} on ${record.date}: ${record.status}`);
    }
  };

  const getAttendanceByDate = (date: string) => {
    return attendance.filter(a => a.date === date);
  };

  // --- Cash Advance Actions ---

  const addCashAdvance = async (ca: CashAdvance) => {
    const dbCA = {
        id: ca.id,
        employee_id: ca.employeeId,
        amount: ca.amount,
        date: ca.date,
        reason: ca.reason,
        is_paid: false,
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('cash_advances').insert(dbCA);
    if (error) throw new Error(error.message);

    const emp = employees.find(e => e.id === ca.employeeId);
    await addAuditLog('CREATE', 'CashAdvance', `Added cash advance Rp ${ca.amount} for ${emp?.fullName}`);
    setCashAdvances(prev => [...prev, { ...ca, createdAt: dbCA.created_at }]);
  };

  const updateCashAdvance = async (ca: CashAdvance) => {
    const existing = cashAdvances.find(c => c.id === ca.id);
    if (!existing) throw new Error("Data kasbon tidak ditemukan.");

    if (existing.isPaid || existing.deductedInPayrollId) {
        await addAuditLog('SYSTEM', 'CashAdvance', `Failed attempt to edit locked cash advance ${ca.id}`);
        throw new Error("Kasbon yang sudah lunas atau terpotong gaji tidak dapat diedit.");
    }

    const dbCA = {
        amount: ca.amount,
        date: ca.date,
        reason: ca.reason
    };

    const { error } = await supabase.from('cash_advances').update(dbCA).eq('id', ca.id);
    if (error) throw new Error(error.message);

    await addAuditLog('UPDATE', 'CashAdvance', `Updated cash advance amount to Rp ${ca.amount} for ${ca.id}`);
    setCashAdvances(prev => prev.map(c => c.id === ca.id ? ca : c));
  };

  const deleteCashAdvance = async (id: string) => {
    const existing = cashAdvances.find(c => c.id === id);
    if (!existing) throw new Error("Data kasbon tidak ditemukan.");

    if (existing.isPaid || existing.deductedInPayrollId) {
         await addAuditLog('SYSTEM', 'CashAdvance', `Failed attempt to delete locked cash advance ${id}`);
         throw new Error("Kasbon yang sudah lunas tidak dapat dihapus.");
    }

    const { error } = await supabase.from('cash_advances').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await addAuditLog('DELETE', 'CashAdvance', `Deleted cash advance request ${id}`);
    setCashAdvances(prev => prev.filter(c => c.id !== id));
  };

  const markCashAdvancePaid = async (id: string) => {
    const { error } = await supabase.from('cash_advances').update({ is_paid: true }).eq('id', id);
    if (error) throw new Error(error.message);

    const ca = cashAdvances.find(c => c.id === id);
    const updated = { ...ca!, isPaid: true };
    await addAuditLog('UPDATE', 'CashAdvance', `Marked cash advance ${id} as Paid`);
    setCashAdvances(prev => prev.map(c => c.id === id ? updated : c));
  };

  // --- Payroll Actions ---

  const generatePayroll = (start: string, end: string): PayrollReport => {
    // Logic remains strictly client-side for calculation, 
    // but fetches latest state from React State (which is synced from Supabase)
    const items = employees.filter(e => e.status === 'Active').map(emp => {
      const empAttendance = attendance.filter(a => 
        a.employeeId === emp.id && 
        a.date >= start && 
        a.date <= end &&
        a.status === 'Present'
      );
      
      const totalPresence = empAttendance.length;
      let totalFullDays = 0;
      let totalHalfDays = 0;

      empAttendance.forEach(record => {
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

      const totalEffectiveDays = totalFullDays + (totalHalfDays * 0.5);
      const totalBasePay = totalEffectiveDays * emp.baseSalary;
      
      const totalOvertimeHours = empAttendance.reduce((sum, record) => {
        return sum + (record.overtimeHours || 0);
      }, 0);

      const overtimeRate = emp.overtimeRate || 0;
      const totalOvertimePay = totalOvertimeHours * overtimeRate;

      const unpaidAdvances = cashAdvances.filter(ca => 
        ca.employeeId === emp.id && 
        !ca.isPaid && 
        ca.date <= end
      );
      
      const totalDeductions = unpaidAdvances.reduce((sum, ca) => sum + ca.amount, 0);
      const deductionIds = unpaidAdvances.map(ca => ca.id);

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
      isDeleted: false
    };
    
    return report;
  };

  const savePayrollReport = async (report: PayrollReport) => {
    const finalReport = { ...report, status: 'Final' as const };
    
    // Call Supabase RPC function for transactional save
    const { error } = await supabase.rpc('save_payroll_transaction', {
        p_report_id: finalReport.id,
        p_period_start: finalReport.periodStart,
        p_period_end: finalReport.periodEnd,
        p_total_payout: finalReport.totalPayout,
        p_generated_at: finalReport.generatedAt,
        p_items: finalReport.items
    });

    if (error) {
        console.error(error);
        throw new Error("Failed to save payroll report: " + error.message);
    }

    // Reload Cash Advances to reflect changes
    const { data: caData } = await supabase.from('cash_advances').select('*');
    if (caData) {
        setCashAdvances(caData.map((c: any) => ({
            id: c.id,
            employeeId: c.employee_id,
            amount: c.amount,
            date: c.date,
            reason: c.reason,
            isPaid: c.is_paid,
            deductedInPayrollId: c.deducted_in_payroll_id,
            createdAt: c.created_at
        })));
    }

    await addAuditLog('CREATE', 'Payroll', `Generated & Saved Payroll Report for period ${report.periodStart} - ${report.periodEnd}`);
    setPayrollReports(prev => [...prev, finalReport]);
  };

  const deletePayrollReport = async (id: string) => {
    // 1. Revert Cash Advances (Consistency Check)
    const relatedAdvances = cashAdvances.filter(ca => ca.deductedInPayrollId === id);
    
    // Manual revert via loop (Batch update not trivial in Supabase-JS without RPC, loop is okay for small scale)
    for (const ca of relatedAdvances) {
        await supabase.from('cash_advances').update({ is_paid: false, deducted_in_payroll_id: null }).eq('id', ca.id);
    }

    // 2. Soft Delete the Report
    const { error } = await supabase.from('payroll_reports').update({ is_deleted: true }).eq('id', id);
    if (error) throw new Error(error.message);

    // 3. Update State
    setCashAdvances(prev => prev.map(c => c.deductedInPayrollId === id ? { ...c, isPaid: false, deductedInPayrollId: undefined } : c));
    
    const updatedReport = payrollReports.find(p => p.id === id);
    if (updatedReport) {
        setPayrollReports(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
    }

    // 4. Audit Log
    await addAuditLog('DELETE', 'Payroll', `Soft deleted payroll report ${id} and reverted associated deductions.`);
  };

  return (
    <AppContext.Provider value={{
      employees, attendance, cashAdvances, payrollReports, auditLogs, isLoading,
      isAuthenticated, currentUser, login, logout, updateCredentials, resetCredentials,
      addEmployee, updateEmployee, deleteEmployee,
      markAttendance, getAttendanceByDate,
      addCashAdvance, updateCashAdvance, deleteCashAdvance, markCashAdvancePaid,
      generatePayroll, savePayrollReport, deletePayrollReport
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
