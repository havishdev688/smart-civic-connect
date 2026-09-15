'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, PlusCircle } from 'lucide-react';
import ComplaintCard from '@/components/complaint-card';
import { Complaint, Status, Priority } from '@/types';

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('scc_token');
        if (!token) return;

        // Parse token to get citizenId
        const payload = JSON.parse(atob(token.split('.')[1]));
        const citizenId = payload.id;

        const res = await fetch(`http://localhost:5000/api/complaints?citizenId=${citizenId}`);
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints || []);
        }
      } catch (err) {
        console.error('Failed to fetch complaints', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.departmentName && c.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    const matchesPriority = selectedPriority === 'ALL' || c.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Lodged Grievances</h1>
          <p className="text-slate-600 text-xs sm:text-sm">Filter, search and track real-time resolution progress of your complaints.</p>
        </div>
        <Link
          href="/citizen/report"
          className="bg-gov-gold hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-2 text-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          New Grievance
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Complaint No, Title or Department..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white font-semibold focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Grievance Cards Grid */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading your grievances...</div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((cmp) => (
            <ComplaintCard key={cmp.id} complaint={cmp} hrefPrefix="/citizen/complaints" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <p className="font-bold text-sm">No grievances found matching your search filter.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('ALL');
              setSelectedPriority('ALL');
            }}
            className="text-gov-navy font-bold text-xs underline"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
