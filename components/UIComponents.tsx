import React from 'react';
import { X, Loader2 } from 'lucide-react';

// Card
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({
  children,
  className = '',
  title,
}) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-sm ${className}`}>
    {title && (
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-800">
        <h3 className="text-base font-semibold text-slate-200 tracking-wide">{title}</h3>
      </div>
    )}
    <div className="p-4 md:p-6 text-slate-300">{children}</div>
  </div>
);

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  isLoading,
  ...props
}) => {
  const base =
    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:
      'bg-gradient-to-r from-brand-600 to-brand-800 hover:from-brand-500 hover:to-brand-700 text-white shadow-lg shadow-brand-900/40 border border-transparent',
    secondary: 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 shadow-sm',
    danger: 'bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/50',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {isLoading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
};

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input: React.FC<InputProps> = ({ label, className = '', error, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-medium text-slate-400 ml-1">{label}</label>}
    <input
      className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 md:py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-900/50 transition-all text-sm shadow-sm ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}
export const Select: React.FC<SelectProps> = ({ label, children, className = '', ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-medium text-slate-400 ml-1">{label}</label>}
    <div className="relative">
      <select
        className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 md:py-2.5 text-slate-100 appearance-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-900/50 transition-all text-sm shadow-sm ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3 top-3.5 md:top-3 pointer-events-none text-slate-500">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  </div>
);

// Modal
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-slate-900 border border-slate-800 w-full md:w-full max-w-lg rounded-t-2xl md:rounded-xl shadow-2xl relative animate-slide-up md:animate-in md:fade-in md:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0 rounded-t-2xl md:rounded-t-xl">
          <h2 className="text-lg font-semibold text-slate-200 tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 hover:bg-slate-800 rounded-md"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar text-slate-300">{children}</div>
      </div>
    </div>
  );
};

// Status Badge
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  // Adjusted for dark mode contrast
  let color = 'bg-slate-800 text-slate-400 border-slate-700';
  let label = status;

  if (status === 'Active') {
    color = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50';
    label = 'Aktif';
  }
  if (status === 'Present' || status === 'Paid') {
    color = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50';
    label = status === 'Paid' ? 'Lunas' : 'Hadir';
  }
  if (status === 'Inactive') {
    color = 'bg-rose-950/40 text-rose-400 border-rose-900/50';
    label = 'Tidak Aktif';
  }
  if (status === 'Alpha') {
    color = 'bg-rose-950/40 text-rose-400 border-rose-900/50';
    label = 'Alpa';
  }
  if (status === 'Sick') {
    color = 'bg-amber-950/40 text-amber-400 border-amber-900/50';
    label = 'Sakit';
  }
  if (status === 'Permission') {
    color = 'bg-blue-950/40 text-blue-400 border-blue-900/50';
    label = 'Izin';
  }

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${color} uppercase tracking-wider shadow-sm`}
    >
      {label}
    </span>
  );
};
