import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'brand', trend }) => {
  const colorMap = {
    brand: {
      bg: 'bg-brand-500/10 dark:bg-brand-500/15',
      text: 'text-brand-600 dark:text-brand-400',
      border: 'border-brand-500/20',
      gradient: 'from-brand-500/10 to-transparent',
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
    <div className={`relative overflow-hidden glass-card rounded-2xl p-5 border ${c.border} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${c.gradient} rounded-bl-full pointer-events-none`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {value}
            </span>
            {trend && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-2xl ${c.bg} ${c.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
