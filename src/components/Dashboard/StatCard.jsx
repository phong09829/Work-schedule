import React from 'react';

export const StatCard = ({ 
  title, 
  label, 
  value, 
  subtitle, 
  badge, 
  icon: Icon, 
  color = 'brand', 
  iconBg, 
  trend 
}) => {
  const displayTitle = title || label;
  const displaySub = subtitle || badge;

  const colorMap = {
    brand: {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-500/20',
      gradient: 'from-indigo-500/10 to-transparent',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      gradient: 'from-emerald-500/10 to-transparent',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20',
      gradient: 'from-amber-500/10 to-transparent',
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20',
      gradient: 'from-purple-500/10 to-transparent',
    }
  };

  const c = colorMap[color] || colorMap.brand;

  return (
    <div className={`relative overflow-hidden glass-card rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${c.gradient} rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {displayTitle}
          </p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-mono">
              {value}
            </span>
            {trend && (
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {trend}
              </span>
            )}
          </div>
          {displaySub && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
              {displaySub}
            </p>
          )}
        </div>

        <div className={`p-3 sm:p-3.5 rounded-2xl ${iconBg || c.bg} ${c.text} shadow-sm group-hover:scale-110 transition-transform`}>
          {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
      </div>
    </div>
  );
};
