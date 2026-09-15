'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Clock, CheckCircle2, AlertTriangle, FileText, Upload, ChevronRight, HardHat } from 'lucide-react';
import StatCard from '@/components/stat-card';
import ComplaintCard from '@/components/complaint-card';
import { Complaint } from '@/types';
import { getAuthenticatedUser } from '@/lib/auth';

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departmentName, setDepartmentName] = useState('Department');
  const [officerName, setOfficerName] = useState('Officer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const authUser = getAuthenticatedUser();
        if (!authUser) return;

        if (authUser.name) {
          setOfficerName(authUser.name);
        }
        
        const deptId = authUser.departmentId;
        if (!deptId) return;

        const res = await fetch(`http://localhost:5000/api/complaints?departmentId=${deptId}`);
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints || []);
          if (data.complaints.length > 0) {
            setDepartmentName(data.complaints[0].category || 'Department');
          }
        }
      } catch (err) {
        console.error('Failed to fetch officer complaints', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const assignedCount = complaints.length;
  const activeCount = complaints.filter((c) => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;
  const completedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gov-darkNavy via-gov-navy to-gov-deep text-white rounded-2xl p-6 sm:p-8 shadow-lg border-b-4 border-gov-gold">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-gov-gold text-slate-950 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase mb-2">
              <HardHat className="w-3.5 h-3.5" /> Officer Portal • {departmentName}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {officerName}</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Review assigned field grievances, update work status, and upload resolution proof photos.
            </p>
          </div>
          <Link
            href="/officer/complaints"
            className="bg-gov-gold hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl shadow shrink-0 text-xs sm:text-sm transition-transform transform hover:scale-105"
          >
            Manage Assigned Queue ({activeCount})
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Assigned Department Queue"
          value={assignedCount}
          subtitle="Total grievances routed to department"
          icon={FileText}
          colorBg="bg-blue-100"
          colorText="text-gov-navy"
        />
        <StatCard
          title="Pending Field Action"
          value={activeCount}
          subtitle="Active in-progress & assigned"
          icon={Clock}
          colorBg="bg-amber-100"
          colorText="text-amber-900"
        />
        <StatCard
          title="Field Resolutions Done"
          value={completedCount}
          subtitle="Verified with photo evidence"
          icon={CheckCircle2}
          colorBg="bg-emerald-100"
          colorText="text-emerald-800"
        />
      </div>

      {/* Assigned Queue */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Urgent Assigned Grievances</h2>
            <p className="text-slate-500 text-xs">Target SLA deadlines and location maps</p>
          </div>
          <Link href="/officer/complaints" className="text-gov-navy font-bold text-xs hover:underline flex items-center gap-1">
            View All Complaints <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500 font-medium">Loading assigned grievances...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <h3 className="text-lg font-bold text-slate-800 mb-2">No assigned grievances.</h3>
            <p className="text-slate-500 text-sm mb-4">You have caught up with all field work.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {complaints.map((cmp) => (
              <ComplaintCard key={cmp.id} complaint={cmp} hrefPrefix="/officer/complaints" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
