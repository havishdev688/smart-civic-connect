'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, PieChart, TrendingUp, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import StatCard from '@/components/stat-card';

interface DashboardData {
  summary: {
    totalComplaints: number;
    activeComplaints: number;
    resolvedComplaints: number;
    resolutionRate: number;
    aiClassificationAccuracy: number;
    duplicatesPrevented: number;
    citizenSatisfaction: number;
  };
  departmentBreakdown: { name: string; total: number; resolved: number; pending: number; slaHours: number }[];
  priorityDistribution: { label: string; count: number; percentage: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,Department,Total,Resolved,Pending,SLA Target Hours\n";
    data.departmentBreakdown.forEach((dept) => {
      csvContent += `"${dept.name}",${dept.total},${dept.resolved},${dept.pending},${dept.slaHours}h\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "smart_civic_connect_department_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary;
  const breakdown = data?.departmentBreakdown || [];
  const priorities = data?.priorityDistribution || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Analytics & SLA Performance Dashboard</h1>
          <p className="text-slate-600 text-xs sm:text-sm">Department resolution trends, AI accuracy metrics and downloadable reports.</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!data || breakdown.length === 0}
          className="bg-gov-navy hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-xl shadow text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Metric summary */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <StatCard
              title="Total Grievances"
              value={summary?.totalComplaints ?? 0}
              subtitle="All registered cases"
              icon={BarChart3}
              colorBg="bg-blue-100"
              colorText="text-gov-navy"
            />
            <StatCard
              title="Resolution SLA Compliance"
              value={`${summary?.resolutionRate ?? 0}%`}
              subtitle={`${summary?.resolvedComplaints ?? 0} cases resolved`}
              icon={TrendingUp}
              colorBg="bg-emerald-100"
              colorText="text-emerald-800"
            />
            <StatCard
              title="Active Complaints"
              value={summary?.activeComplaints ?? 0}
              subtitle="Pending resolution"
              icon={Clock}
              colorBg="bg-amber-100"
              colorText="text-amber-900"
            />
            <StatCard
              title="AI Accuracy"
              value={summary?.aiClassificationAccuracy ? `${summary.aiClassificationAccuracy}%` : 'N/A'}
              subtitle={`${summary?.duplicatesPrevented ?? 0} duplicates prevented`}
              icon={ShieldCheck}
              colorBg="bg-purple-100"
              colorText="text-purple-800"
            />
          </div>

          {/* Department Breakdown & Priority Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Department Performance Breakdown</h3>
              {breakdown.length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center">No department metrics available.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {breakdown.map((dept, idx) => (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{dept.name}</span>
                        <span>{dept.total} Total ({dept.resolved} Resolved, {dept.pending} Pending)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${dept.total > 0 ? (dept.resolved / dept.total) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: `${dept.total > 0 ? (dept.pending / dept.total) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>Target SLA: {dept.slaHours}h</span>
                        <span>Resolution Rate: {dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Priority Breakdown Distribution</h3>
              {priorities.length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center">No priority metrics recorded.</p>
              ) : (
                <div className="space-y-4 pt-2 text-xs">
                  {priorities.map((p, idx) => {
                    const colorMap: Record<string, string> = {
                      EMERGENCY: 'bg-red-600',
                      HIGH: 'bg-orange-500',
                      MEDIUM: 'bg-blue-600',
                      LOW: 'bg-slate-500',
                    };
                    return (
                      <div key={idx}>
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span>{p.label} Priority ({p.percentage}%)</span>
                          <span>{p.count} Cases</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className={`${colorMap[p.label] || 'bg-blue-600'} h-full transition-all`}
                            style={{ width: `${p.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
