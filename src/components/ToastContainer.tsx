import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 5500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Floating Overlay */}
      <div className="fixed bottom-5 right-5 z-[9999] space-y-3 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fadeIn ${
              toast.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/40 text-amber-200'
                : toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-900/95 border-indigo-500/40 text-indigo-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 text-xs space-y-0.5">
              <h4 className="font-bold text-slate-100">{toast.title}</h4>
              <p className="text-slate-300 leading-relaxed">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      addToast: (type: ToastType, title: string, message: string) => {
        console.warn(`[Toast Fallback - ${type}]: ${title} - ${message}`);
      },
      removeToast: () => {},
    };
  }
  return context;
};
