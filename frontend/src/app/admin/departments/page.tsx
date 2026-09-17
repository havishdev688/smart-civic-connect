'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Clock, Settings, Eye, FileText } from 'lucide-react';

interface DeptInfo {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  slaHours: number;
  activeComplaints: number;
  totalResolved: number;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DeptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSLA, setNewSLA] = useState<number>(0);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`);
        if (res.ok) {
          setDepartments(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch departments', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleSLAUpdate = async (deptId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/${deptId}/sla`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slaHours: newSLA })
      });

      if (res.ok) {
        setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, slaHours: newSLA } : d));
        setEditingId(null);
        alert('SLA updated successfully');
      }
    } catch (err) {
      console.error('Failed to update SLA', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Municipal Departments & SLA Configuration</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Manage resolution timeframe SLAs and active department officer teams.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <h3 className="text-lg font-bold text-slate-800 mb-2">No departments configured.</h3>
          <p className="text-slate-500 text-sm">Run the database seed to create departments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[10px] font-bold bg-blue-50 text-gov-navy px-2 py-0.5 rounded border border-blue-200">{dept.code}</span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-1">{dept.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-gov-navy flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">{dept.description}</p>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block">Enforced SLA Target</span>
                  {editingId === dept.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={newSLA}
                        onChange={(e) => setNewSLA(parseInt(e.target.value))}
                        className="w-20 px-2 py-1 rounded border border-slate-300 text-slate-900 font-bold"
                        min={1}
                      />
                      <span className="text-slate-500">Hours</span>
                      <button onClick={() => handleSLAUpdate(dept.id)} className="bg-gov-navy text-white px-2 py-1 rounded text-[10px] font-bold">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 text-[10px] font-bold">Cancel</button>
                    </div>
                  ) : (
                    <strong className="text-slate-900 font-extrabold text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gov-navy" /> {dept.slaHours} Hours
                    </strong>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block">Active Cases</span>
                  <strong className="text-amber-800 font-extrabold text-sm">{dept.activeComplaints} Pending</strong>
                  <span className="text-slate-400 text-[10px] block mt-0.5">{dept.totalResolved} Resolved</span>
                </div>
              </div>

              {/* Actions Row */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => { setEditingId(dept.id); setNewSLA(dept.slaHours); }}
                  className="flex-1 bg-gov-navy text-white font-bold py-2 rounded-lg text-[11px] flex items-center justify-center gap-1 hover:bg-blue-800 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" /> Configure SLA
                </button>
                <button
                  onClick={() => window.location.href = `/admin/complaints?dept=${dept.code}`}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-[11px] flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> View Complaints
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
