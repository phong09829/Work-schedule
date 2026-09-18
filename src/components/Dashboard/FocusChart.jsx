import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3, PieChart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const FocusChart = () => {
  const { pomoSessions, tasks } = useApp();
  const { isDark } = useTheme();

  // Compute 7-day focus data
  const { labels, dataPoints } = useMemo(() => {
    const days = [];
    const points = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const totalMins = pomoSessions
        .filter(s => s.date === dateStr && s.type === 'focus')
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      days.push(`${dayName} (${d.getDate()}/${d.getMonth() + 1})`);
      points.push(totalMins);
    }

    return { labels: days, dataPoints: points };
  }, [pomoSessions]);

  // Compute Category Distribution
  const categoryStats = useMemo(() => {
    const counts = {
      'Học tập': 0,
      'Công việc': 0,
      'Cá nhân': 0,
    };

    tasks.forEach(t => {
      const cat = t.category || 'Công việc';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    return { labels, data };
  }, [tasks]);

  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

  const barData = {
    labels,
    datasets: [
      {
        label: 'Thời gian tập trung (Phút)',
        data: dataPoints,
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 70, 229, 0.85)',
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: '#818CF8',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        titleColor: isDark ? '#F8FAFC' : '#0F172A',
        bodyColor: isDark ? '#CBD5E1' : '#334155',
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context) => ` ${context.parsed.y} phút tập trung`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: 'inherit', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'inherit', size: 11 } },
      },
    },
  };

  const doughnutData = {
    labels: categoryStats.labels,
    datasets: [
      {
        data: categoryStats.data,
        backgroundColor: [
          '#6366F1', // Indigo / Brand (Học tập)
          '#0EA5E9', // Sky (Công việc)
          '#10B981', // Emerald (Cá nhân)
          '#F59E0B', // Amber
        ],
        borderWidth: 2,
        borderColor: isDark ? '#111827' : '#FFFFFF',
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          font: { family: 'inherit', size: 12, weight: '500' },
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        titleColor: isDark ? '#F8FAFC' : '#0F172A',
        bodyColor: isDark ? '#CBD5E1' : '#334155',
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        padding: 10,
      },
    },
    cutout: '70%',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 7-Day Focus Bar Chart */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Xu Hướng Năng Suất 7 Ngày</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng số phút tập trung mỗi ngày qua Pomodoro</p>
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-72 w-full">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Category Doughnut Chart */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Phân Bổ Danh Mục</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ công việc theo chủ đề</p>
          </div>
        </div>
        <div className="h-56 w-full flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
};
