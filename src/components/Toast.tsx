import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          useEffect(() => {
            const timer = setTimeout(() => {
              onRemove(toast.id);
            }, 4000);
            return () => clearTimeout(timer);
          }, [toast.id, onRemove]);

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : toast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
              </div>
              <div className="flex-1 font-medium">{toast.message}</div>
              <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 p-0.5 rounded-md hover:bg-black/5 opacity-60 hover:opacity-100 transition-colors"
                id={`toast-close-${toast.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
