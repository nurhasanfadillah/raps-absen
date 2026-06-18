# Coding Conventions

## File Naming

| Pattern | Convention | Examples |
|---|---|---|
| React components | PascalCase `.tsx` | `UIComponents.tsx`, `Employees.tsx` |
| Utilities / services | camelCase `.ts` | `pdfService.ts`, `config.ts` |
| Library clients | camelCase `.ts` | `supabase.ts`, `db.ts` |
| Build config | camelCase `.ts` | `vite.config.ts`, `tsconfig.json` |

All pages in `pages/` use PascalCase matching the route concept (e.g., `CashAdvance.tsx` for `/cash-advance`).

## TypeScript Patterns

**Config** (`tsconfig.json`):
- Target: ES2022
- Module: ESNext
- `isolatedModules: true`
- `allowImportingTsExtensions: true`
- `noEmit: true` (Vite handles compilation)
- `skipLibCheck: true`
- **Note: `strict: true` is NOT enabled** — this is a gap

**Type definitions** (`types.ts`):
- `interface` for object shapes: `Employee`, `AttendanceRecord`, `PayrollReport`
- `type` for union literals: `type Role = 'Admin' | 'Staff' | 'Manager' | 'Intern'`
- Optional fields with `?`: `email?: string`, `notes?: string`

**Generics**:
- Context: `createContext<AppContextType | undefined>(undefined)` (`store.tsx`)
- IDB schema: `IDBPDatabase<RapsDB>` (`lib/db.ts:39-78`)

**Path alias**: `@/*` maps to `./` — allows `import { useApp } from '@/store'`

## Export Patterns

**Named exports** — preferred for utilities, hooks, and UI components:
```ts
// components/UIComponents.tsx
export const Card = ...
export const Button = ...
export const Modal = ...

// components/Feedback.tsx
export const FeedbackProvider = ...
export const useToast = ...
export const useConfirm = ...

// lib/supabase.ts
export const supabase = ...

// config.ts
export const WORK_START_TIME = ...
```

**Default exports** — used for page components and App:
```ts
// pages/*.tsx
export default Dashboard
export default Employees

// App.tsx
export default App
```

**No barrel files** — no `index.ts` re-exports; all imports use direct file paths.

## Component Patterns

**All components are functional** with `React.FC<Props>` type annotation.

**Inline props for simple components:**
```tsx
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ...
```

**Interface for complex components:**
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => ...
```

**HTML attribute pass-through** via rest spread: `{...props}`

**Styling**: Tailwind utility classes, conditional via ternary and template literals.
No CSS modules. No styled-components.

## Hook Patterns

**Standard hooks**: `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef` — all used.

**Custom context hooks** always throw if used outside provider:
```ts
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within FeedbackProvider');
  return context;
};
```

**useCallback for context functions** (`Feedback.tsx:99-106`):
```ts
const addToast = useCallback((type: ToastType, title: string, message: string) => {
  const id = Math.random().toString(36).substr(2, 9);
  setToasts(prev => [...prev, { id, type, title, message }]);
}, []);
```

## Error Handling

**Try-catch with toast feedback** — standard pattern in all page handlers:
```ts
try {
  await addEmployee({ ... });
  addToast('success', 'Berhasil', 'Data tersimpan.');
} catch (error) {
  addToast('error', 'Gagal', 'Terjadi kesalahan.');
}
```

**Store throws on Supabase error:**
```ts
const { error } = await supabase.from('employees').insert(dbEmp);
if (error) throw new Error(error.message);
```

**Business rule validation via throw** (`store.tsx:326-337`):
```ts
if (hasAttendance || hasCashAdvance) {
  throw new Error('Karyawan memiliki riwayat transaksi...');
}
```

**Gap**: Many catch blocks use `catch (error: any)` — should be `catch (error: unknown)`.

## Code Style (Observed, Not Enforced)

| Rule | Value |
|---|---|
| Indentation | 2 spaces |
| Semicolons | Yes |
| Quotes | Single quotes |
| Arrow functions | Preferred over `function` declarations |
| `const` vs `let` | `const` preferred |
| Line length | ~80–100 chars |

**No ESLint. No Prettier configured.** Style is manually consistent but not enforced.

## Naming Conventions (Summary)

| Item | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `Employees.tsx` |
| Files (utils) | camelCase | `pdfService.ts` |
| Components | PascalCase | `EmployeeCard` |
| Interfaces | PascalCase | `Employee`, `PayrollReport` |
| Type aliases | PascalCase | `AttendanceStatus` |
| Functions/variables | camelCase | `handleSubmit`, `isLoading` |
| Custom hooks | `use` + camelCase | `useToast`, `useApp` |
| Constants | UPPER_SNAKE_CASE | `WORK_START_TIME` |
| Database keys | snake_case | `full_name`, `check_in_time` |
| App state keys | camelCase | `fullName`, `checkInTime` |
