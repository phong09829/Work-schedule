import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-400 shrink-0" />,
  };

  const bgColors = {
    success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200 dark:bg-emerald-950/90',
    warning: 'border-amber-500/30 bg-amber-950/90 text-amber-200 dark:bg-amber-950/90',
    error: 'border-rose-500/30 bg-rose-950/90 text-rose-200 dark:bg-rose-950/90',
    info: 'border-brand-500/30 bg-slate-900/95 text-slate-100 dark:bg-slate-900/95',
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
          bgColors[toast.type] || bgColors.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
};
