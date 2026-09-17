'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Users, Building2, ShieldCheck, CheckCircle2, Clock, AlertTriangle, FileSpreadsheet, Bot, ChevronRight, Activity } from 'lucide-react';
import StatCard from '@/components/stat-card';
import { getAuthenticatedUser } from '@/lib/auth';

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

interface DeptInfo {
  id: string;
  name: string;
  code: string;
  slaHours: number;
  activeComplaints: number;
  totalResolved: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [departments, setDepartments] = useState<DeptInfo[]>([]);
  const [adminName, setAdminName] = useState('Administrator');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUser = getAuthenticatedUser();
    if (authUser && authUser.name) {
      setAdminName(authUser.name);
    }

    const fetchAll = async () => {
      try {
        const [analyticsRes, deptRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`),
        ]);

        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        }
        if (deptRes.ok) {
          setDepartments(await deptRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const summary = data?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-gov-darkNavy via-gov-navy to-gov-deep text-white rounded-2xl p-6 sm:p-8 shadow-xl border-b-4 border-gov-gold">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-gov-gold text-slate-950 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> District Administrator Control Panel
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{adminName}</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Real-time monitoring of Municipal Grievance SLAs, department allocation & AI accuracy.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <Link
              href="/admin/analytics"
              className="bg-gov-gold hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl shadow text-xs flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> Full Analytics & SLA Heatmaps
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading dashboard metrics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Municipal Complaints"
            value={summary?.totalComplaints ?? 0}
            subtitle={`${summary?.resolutionRate ?? 0}% SLA Compliance Rate`}
            icon={FileSpreadsheet}
            colorBg="bg-blue-100"
            colorText="text-gov-navy"
          />
          <StatCard
            title="Active Field Cases"
            value={summary?.activeComplaints ?? 0}
            subtitle={`Assigned across ${departments.length} departments`}
            icon={Clock}
            colorBg="bg-amber-100"
            colorText="text-amber-900"
          />
          <StatCard
            title="AI Classification Accuracy"
            value={summary?.aiClassificationAccuracy ? `${summary.aiClassificationAccuracy}%` : 'N/A'}
            subtitle={`${summary?.duplicatesPrevented ?? 0} Duplicates Prevented`}
            icon={Bot}
            colorBg="bg-purple-100"
            colorText="text-purple-800"
          />
          <StatCard
            title="Citizen Satisfaction Rating"
            value={summary?.citizenSatisfaction ? `${summary.citizenSatisfaction} / 5.0` : 'N/A'}
            subtitle={`Based on ${summary?.resolvedComplaints ?? 0} resolutions`}
            icon={CheckCircle2}
            colorBg="bg-emerald-100"
            colorText="text-emerald-800"
          />
        </div>
      )}

      {/* Admin Management Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/admin/complaints" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-gov-navy transition-all group">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-gov-navy flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Grievance Re-assignment</h3>
          <p className="text-slate-500 text-xs mt-1">Override AI department mapping & force priority escalation.</p>
        </Link>

        <Link href="/admin/departments" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-gov-navy transition-all group">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Department SLA Rules</h3>
          <p className="text-slate-500 text-xs mt-1">Configure target resolution hours for Roads, Water, Sanitation, Lighting.</p>
        </Link>

        <Link href="/admin/audit-logs" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-gov-navy transition-all group">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">System Audit Logs</h3>
          <p className="text-slate-500 text-xs mt-1">Inspect officer status updates, login attempts & AI predictions.</p>
        </Link>
      </div>

      {/* Department SLA Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-base text-slate-900">Municipal Department Performance</h3>
          <Link href="/admin/departments" className="text-gov-navy font-bold text-xs hover:underline">Manage All</Link>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No department data available yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">{d.name}</div>
                  <div className="text-slate-500">SLA Target: <strong>{d.slaHours} Hours</strong></div>
                </div>
                <div className="text-right">
                  <span className="bg-blue-100 text-gov-navy font-bold px-2 py-0.5 rounded-full text-[10px] block mb-1">
                    {d.activeComplaints} Active
                  </span>
                  <span className="text-[10px] text-slate-400">{d.totalResolved} Resolved</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
