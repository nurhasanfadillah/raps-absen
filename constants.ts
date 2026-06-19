export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  SICK: 'Sick',
  PERMISSION: 'Permission',
  ALPHA: 'Alpha',
  OFF: 'Off',
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export const PAYROLL_STATUS = {
  DRAFT: 'Draft',
  FINAL: 'Final',
  PAID: 'Paid',
} as const;

export const ACTION_TYPE = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SYSTEM: 'SYSTEM',
  AUTH: 'AUTH',
} as const;
