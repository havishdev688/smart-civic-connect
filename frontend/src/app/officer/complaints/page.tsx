'use client';

import React, { useState, useEffect } from 'react';
import ComplaintCard from '@/components/complaint-card';
import { Complaint } from '@/types';

export default function OfficerComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('scc_token');
        if (!token) return;

        const payload = JSON.parse(atob(token.split('.')[1]));
        const deptId = payload.departmentId;
        if (!deptId) return;

        const res = await fetch(`http://localhost:5000/api/complaints?departmentId=${deptId}`);
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints || []);
        }
      } catch (err) {
        console.error('Failed to fetch officer complaints', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Officer Grievance Queue</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Manage assigned complaints, transition statuses, and attach resolution proof.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading officer grievance queue...</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-bold text-sm">No complaints assigned to your department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {complaints.map((cmp) => (
            <ComplaintCard key={cmp.id} complaint={cmp} hrefPrefix="/officer/complaints" />
          ))}
        </div>
      )}
    </div>
  );
}
