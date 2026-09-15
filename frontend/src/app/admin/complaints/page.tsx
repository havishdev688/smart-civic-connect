'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import ComplaintCard from '@/components/complaint-card';
import { Complaint, Department } from '@/types';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedCmp, setSelectedCmp] = useState<Complaint | null>(null);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComplaintsAndDepts = async () => {
    try {
      const [cmpRes, deptRes] = await Promise.all([
        fetch('http://localhost:5000/api/complaints'),
        fetch('http://localhost:5000/api/departments')
      ]);

      if (cmpRes.ok) {
        const cmpData = await cmpRes.json();
        setComplaints(cmpData.complaints || []);
      }
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData || []);
        if (deptData.length > 0) {
          setNewDeptCode(deptData[0].code);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin complaints data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintsAndDepts();
  }, []);

  const handleReassign = (cmp: Complaint) => {
    setSelectedCmp(cmp);
    setReassignModalOpen(true);
  };

  const confirmReassign = async () => {
    if (!selectedCmp || !newDeptCode) return;

    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${selectedCmp.id}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentCode: newDeptCode })
      });

      if (res.ok) {
        await fetchComplaintsAndDepts();
        setReassignModalOpen(false);
      } else {
        alert('Failed to reassign complaint');
      }
    } catch (err) {
      console.error('Reassignment error', err);
      alert('Error connecting to backend');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    return (
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.departmentName && c.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">All Municipal Grievances</h1>
          <p className="text-slate-600 text-xs sm:text-sm">Admin Master View. Reassign departments, override priorities and monitor all active cases.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Complaint No, Title, or Department..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading all grievances...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-bold text-sm">No grievances found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredComplaints.map((cmp) => (
            <div key={cmp.id} className="relative flex flex-col">
              <ComplaintCard complaint={cmp} hrefPrefix="/citizen/complaints" />
              <button
                onClick={() => handleReassign(cmp)}
                className="mt-2 w-full bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gov-gold" /> Reassign Department
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModalOpen && selectedCmp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-slate-900">Reassign Grievance Department</h3>
            <p className="text-slate-600">Reassigning reference: <strong>{selectedCmp.complaintNo}</strong></p>

            <div>
              <label className="block font-bold mb-1">Target Municipal Department:</label>
              <select
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>{d.name} ({d.slaHours}h SLA)</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReassignModalOpen(false)} className="px-4 py-2 bg-slate-100 font-bold rounded-lg hover:bg-slate-200">Cancel</button>
              <button onClick={confirmReassign} className="px-4 py-2 bg-gov-navy text-white font-bold rounded-lg hover:bg-blue-800">Confirm Reassignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
