
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const styles = {
    SUCCESS: 'bg-white border-l-4 border-emerald-500 text-gray-800 shadow-lg',
    ERROR: 'bg-white border-l-4 border-red-500 text-gray-800 shadow-lg',
    INFO: 'bg-white border-l-4 border-blue-500 text-gray-800 shadow-lg',
  };

  const icons = {
    SUCCESS: <CheckCircle size={20} className="text-emerald-500" />,
    ERROR: <AlertCircle size={20} className="text-red-500" />,
    INFO: <Info size={20} className="text-blue-500" />,
  };

  return (
    <div className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded shadow-xl flex items-start gap-3 transform transition-all animate-in slide-in-from-right fade-in duration-300 ${styles[toast.type]}`}>
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastContainer;
