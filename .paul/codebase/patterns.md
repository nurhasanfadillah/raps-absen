# Code Patterns

Recurring patterns and idioms found in this codebase — use these as reference when adding new features.

## Context Hook Pattern

Every context has a typed accessor hook with guard:

```ts
// store.tsx
export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// Usage in page:
const { employees, addEmployee } = useApp();
```

Apply this pattern when adding new contexts.

---

## Async Action + Toast Pattern

All create/update/delete actions follow this shape in page components:

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await addEmployee({ ...formData, id: `EMP-${Date.now().toString().slice(-4)}` } as Employee);
    addToast('success', 'Berhasil Ditambahkan', 'Data karyawan berhasil disimpan.');
    closeModal();
  } catch (error) {
    addToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data.');
  }
};
```

---

## Confirm Dialog Before Destructive Action

```ts
// pages/Employees.tsx:55-74
const handleDelete = (id: string, name: string) => {
  confirm({
    title: 'Hapus Karyawan?',
    message: `Tindakan ini tidak dapat dibatalkan.`,
    variant: 'danger',
    confirmText: 'Ya, Hapus',
    onConfirm: async () => {
      try {
        await deleteEmployee(id);
        addToast('success', 'Data Dihapus', `...`);
      } catch (error: any) {
        addToast('error', 'Penghapusan Ditolak', error.message);
      }
    }
  });
};
```

---

## Supabase Action in Store

Store actions follow this shape — map app model → DB schema → insert → throw on error → update state:

```ts
// store.tsx:282-301
const addEmployee = async (emp: Omit<Employee, 'createdAt'>) => {
  const dbEmp = {
    full_name: emp.fullName,
    role: emp.role,
    // ... camelCase → snake_case mapping
  };
  const { error } = await supabase.from('employees').insert(dbEmp);
  if (error) throw new Error(error.message);
  await addAuditLog('CREATE', 'Employee', `...`);
  setEmployees(prev => [...prev, { ...emp, createdAt: new Date().toISOString() }]);
};
```

---

## Soft Delete Pattern

Employees and payroll reports are never hard-deleted:

```ts
// store.tsx (conceptual)
const deleteEmployee = async (id: string) => {
  // 1. Check for linked data first
  if (hasLinkedData) throw new Error('Cannot delete — linked records exist');
  // 2. Mark inactive (soft delete)
  await supabase.from('employees').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  // 3. Filter out of local state
  setEmployees(prev => prev.filter(e => e.id !== id));
};
```

---

## camelCase ↔ snake_case Boundary

DB → App (on load):
```ts
setEmployees(empData.map((e: any) => ({
  id: e.id,
  fullName: e.full_name,
  role: e.role,
  // ...
})));
```

App → DB (on write):
```ts
const dbEmp = {
  full_name: emp.fullName,
  role: emp.role,
  // ...
};
```

---

## Modal Form Pattern

Pages use a single modal for both create and edit:

```ts
// Local state in page component
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [formData, setFormData] = useState<Partial<Employee>>({});

// Open for create
const openModal = () => { setEditingId(null); setFormData({}); setIsModalOpen(true); };

// Open for edit
const openEditModal = (emp: Employee) => {
  setEditingId(emp.id);
  setFormData(emp);
  setIsModalOpen(true);
};

// Submit handles both
if (editingId) await updateEmployee({ ...formData, id: editingId });
else await addEmployee({ ...formData });
```

---

## Audit Log (Called Inside Every Store Action)

```ts
// store.tsx:197-211
const addAuditLog = async (actionType: ActionType, entity: string, description: string) => {
  const log = {
    timestamp: new Date().toISOString(),
    user_name: currentUser || 'System',
    action_type: actionType,
    entity,
    description
  };
  await supabase.from('audit_logs').insert(log);
  setAuditLogs(prev => [{ ...log, user: log.user_name } as AuditLog, ...prev]);
};
```

Call this at the end of every create/update/delete action in the store.

---

## Status Badge Rendering

Use `StatusBadge` from `UIComponents.tsx` for any entity status:

```tsx
<StatusBadge status={employee.status} />
// Renders: color-coded pill with text
```

The component maps known status strings to Tailwind color classes.
