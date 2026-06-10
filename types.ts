

export type Role = 'Admin' | 'Staff' | 'Manager' | 'Intern';

export interface Employee {
  id: string;
  fullName: string;
  role: Role;
  baseSalary: number; // Gaji Pokok HARIAN
  overtimeRate: number; // Upah Lembur Per Jam (Dinamis)
  joinDate: string;
  status: 'Active' | 'Inactive';
  phone: string;
  email?: string; // Optional
  createdAt?: string;
  deletedAt?: string; // Soft delete
}

export type AttendanceStatus = 'Present' | 'Sick' | 'Permission' | 'Alpha' | 'Off';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO Date YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  overtimeHours?: number; // Jumlah jam lembur pada hari tersebut
  notes?: string;
  updatedAt?: string;
}

export interface CashAdvance {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  reason: string;
  isPaid: boolean; // Jika true, sudah dipotong atau dibayar
  deductedInPayrollId?: string; // Link ke payroll tertentu
  createdAt?: string;
}

export interface PayrollItem {
  id?: string;
  payrollReportId?: string; // Foreign Key
  employeeId: string;
  employeeName: string;
  role: Role;
  baseSalary: number; // Nominal Gaji Harian
  
  // Audit Kehadiran
  totalPresence: number; // Total hari hadir fisik (count)
  totalFullDays: number; // Hadir <= 09:00
  totalHalfDays: number; // Hadir > 09:00
  totalEffectiveDays: number; // (Full * 1) + (Half * 0.5)
  totalBasePay: number; // totalEffectiveDays * baseSalary
  
  totalOvertimeHours: number; 
  overtimeRate: number; 
  totalOvertimePay: number; 
  
  // Deduksi
  deductionIds?: string[]; // Array ID Kasbon yang spesifik dipotong
  totalDeductions: number; 
  netSalary: number;
  periodStart?: string; // Helper for UI
  periodEnd?: string; // Helper for UI
}

export type PayrollStatus = 'Draft' | 'Final' | 'Paid';

export interface PayrollReport {
  id: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  items: PayrollItem[];
  totalPayout: number;
  status: PayrollStatus;
  isDeleted?: boolean; // Soft delete flag
}

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYSTEM' | 'AUTH';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: ActionType;
  entity: 'Employee' | 'Attendance' | 'CashAdvance' | 'Payroll' | 'Auth';
  description: string;
  user: string; // Typically 'Admin' for this localized version
}

export interface AuthCreds {
  id: string; // usually 'admin'
  username: string;
  passwordHash: string;
}