import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorBg?: string;
  colorText?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorBg = 'bg-blue-50',
  colorText = 'text-gov-navy',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</div>}
      </div>
      <div className={`w-12 h-12 rounded-xl ${colorBg} ${colorText} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
