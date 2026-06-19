import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon, Loader2 } from 'lucide-react';

// --- Types ---

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  variant?: 'danger' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message: string) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

// --- Contexts ---

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

// --- Components ---

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
  };

  // High Contrast Styles for Accessibility (WCAG AA)
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100',
    error: 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100',
    info: 'bg-sky-50 border-sky-200 text-sky-800 shadow-sky-100',
  };

  const icons = {
    success: <CheckCircle className="text-emerald-600" size={20} />,
    error: <AlertOctagon className="text-rose-600" size={20} />,
    warning: <AlertTriangle className="text-amber-600" size={20} />,
    info: <Info className="text-sky-600" size={20} />,
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 pointer-events-auto min-w-[320px] max-w-md
        ${styles[toast.type]}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1">
        <h4 className="font-bold text-sm tracking-wide">{toast.title}</h4>
        <p className="text-sm mt-1 leading-relaxed font-medium opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// --- Providers ---

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    options: null,
    isLoading: false,
  });

  // Toast Logic
  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Confirm Logic
  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState({ isOpen: true, options, isLoading: false });
  }, []);

  const handleConfirm = async () => {
    if (!confirmState.options) return;

    setConfirmState((prev) => ({ ...prev, isLoading: true }));
    try {
      await confirmState.options.onConfirm();
      setConfirmState({ isOpen: false, options: null, isLoading: false });
    } catch (error) {
      setConfirmState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancel = () => {
    setConfirmState({ isOpen: false, options: null, isLoading: false });
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <ConfirmContext.Provider value={{ confirm }}>
        {children}

        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </div>

        {/* Global Confirm Dialog */}
        {confirmState.isOpen && confirmState.options && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
              onClick={!confirmState.isLoading ? handleCancel : undefined}
            />
            <div className="bg-white border border-gray-200 w-full max-w-md rounded-xl shadow-2xl relative animate-slide-up overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full shrink-0 ${
                      confirmState.options.variant === 'danger'
                        ? 'bg-rose-50 text-rose-600'
                        : confirmState.options.variant === 'warning'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    {confirmState.options.variant === 'danger' ? (
                      <AlertOctagon size={24} />
                    ) : confirmState.options.variant === 'warning' ? (
                      <AlertTriangle size={24} />
                    ) : (
                      <Info size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {confirmState.options.title}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 leading-relaxed">
                      {confirmState.options.message}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  onClick={handleCancel}
                  disabled={confirmState.isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {confirmState.options.cancelText || 'Batal'}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirmState.isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 ${
                    confirmState.options.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-brand-600 hover:bg-brand-700'
                  }`}
                >
                  {confirmState.isLoading && <Loader2 size={16} className="animate-spin" />}
                  {confirmState.options.confirmText || 'Konfirmasi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
};

// --- Hooks ---

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within FeedbackProvider');
  return context;
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within FeedbackProvider');
  return context;
};
