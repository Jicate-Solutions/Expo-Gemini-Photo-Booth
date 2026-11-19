'use client';

import { Camera, Users, CalendarDays, Layers } from 'lucide-react';

interface StatsOverviewProps {
  totalExpos: number;
  activeExpos: number;
  totalVisitors: number;
  totalPhotos: number;
  totalGroups: number;
}

export default function StatsOverview({ totalExpos, activeExpos, totalVisitors, totalPhotos, totalGroups }: StatsOverviewProps) {
  const stats = [
    {
      label: 'Active Expos',
      value: activeExpos,
      subtext: `${totalExpos} total`,
      icon: CalendarDays,
      accent: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total Visitors',
      value: totalVisitors,
      subtext: totalExpos > 0 ? `~${Math.round(totalVisitors / Math.max(activeExpos, 1))} per expo` : '—',
      icon: Users,
      accent: 'from-sky-500 to-blue-500',
      iconBg: 'bg-sky-50 border-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      label: 'Photos Generated',
      value: totalPhotos,
      subtext: totalVisitors > 0 ? `${(totalPhotos / totalVisitors).toFixed(1)} avg per visitor` : '—',
      icon: Camera,
      accent: 'from-amber-400 to-orange-500',
      iconBg: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Total Groups',
      value: totalGroups,
      subtext: totalExpos > 0 ? `~${Math.round(totalGroups / Math.max(activeExpos, 1))} per expo` : '—',
      icon: Layers,
      accent: 'from-violet-500 to-fuchsia-500',
      iconBg: 'bg-violet-50 border-violet-100',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* thin accent bar */}
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`} />
          <div className="flex items-start justify-between mb-4">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{stat.label}</div>
            <div className={`w-9 h-9 ${stat.iconBg} border rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-[18px] h-[18px] ${stat.iconColor}`} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            {stat.value.toLocaleString()}
          </div>
          <div className="text-slate-400 text-xs mt-1">{stat.subtext}</div>
        </div>
      ))}
    </div>
  );
}
