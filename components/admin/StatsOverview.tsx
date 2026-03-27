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
      color: 'purple',
      gradient: 'from-purple-600/20 to-purple-600/5',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-600/20',
      iconColor: 'text-purple-400',
      valueColor: 'text-purple-300',
    },
    {
      label: 'Total Visitors',
      value: totalVisitors,
      subtext: totalExpos > 0 ? `~${Math.round(totalVisitors / Math.max(activeExpos, 1))}/expo` : '—',
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-600/20 to-blue-600/5',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-600/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-300',
    },
    {
      label: 'Photos Generated',
      value: totalPhotos,
      subtext: totalVisitors > 0 ? `${(totalPhotos / totalVisitors).toFixed(1)} avg/visitor` : '—',
      icon: Camera,
      color: 'pink',
      gradient: 'from-pink-600/20 to-pink-600/5',
      border: 'border-pink-500/20',
      iconBg: 'bg-pink-600/20',
      iconColor: 'text-pink-400',
      valueColor: 'text-pink-300',
    },
    {
      label: 'Total Groups',
      value: totalGroups,
      subtext: totalExpos > 0 ? `~${Math.round(totalGroups / Math.max(activeExpos, 1))}/expo` : '—',
      icon: Layers,
      color: 'emerald',
      gradient: 'from-emerald-600/20 to-emerald-600/5',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-600/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-2xl p-4`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
            </div>
          </div>
          <div className={`text-2xl font-black ${stat.valueColor} mb-0.5`}>
            {stat.value.toLocaleString()}
          </div>
          <div className="text-gray-400 text-xs font-medium">{stat.label}</div>
          <div className="text-gray-600 text-[10px] mt-0.5">{stat.subtext}</div>
        </div>
      ))}
    </div>
  );
}
