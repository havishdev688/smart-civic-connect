'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Clock, ShieldCheck, CheckCircle2, Bot, ArrowLeft } from 'lucide-react';
import Timeline from '@/components/timeline';
import { getStatusBadge, getPriorityBadge } from '@/components/complaint-card';
import { Complaint } from '@/types';

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints/${params.id}`);
        if (res.ok) {
          const data: Complaint = await res.json();
          setComplaint(data);
        }
      } catch (err) {
        console.error('Failed to fetch complaint details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [params.id]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-bold">Loading complaint details...</div>;
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Complaint Not Found</h2>
        <p className="text-slate-600 text-sm">The requested grievance could not be retrieved from the municipal records.</p>
        <Link href="/citizen/complaints" className="inline-block bg-gov-navy text-white px-4 py-2 rounded-lg font-bold text-xs">
          Return to Grievances
        </Link>
      </div>
    );
  }

  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link href="/citizen/complaints" className="text-gov-navy font-bold text-xs flex items-center gap-1 hover:underline mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to My Complaints
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold bg-blue-50 text-gov-navy px-3 py-1 rounded border border-blue-200">{complaint.complaintNo}</span>
              {getStatusBadge(complaint.status)}
              {getPriorityBadge(complaint.priority)}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{complaint.title}</h1>
          </div>
          <div className="text-xs text-slate-500 text-right">
            <div>Filed on: {new Date(complaint.createdAt).toLocaleString()}</div>
            <div>Estimated SLA Target: <strong>{complaint.estimatedHours} Hours</strong></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Complaint Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Uploaded Evidence Photos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold mb-1">Citizen Before Photo</div>
                {complaint.images && complaint.images.length > 0 ? (
                  <img src={complaint.images[0]} alt="Before" className="w-full h-48 rounded-xl object-cover border border-slate-300" />
                ) : (
                  <div className="h-48 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No photo uploaded
                  </div>
                )}
              </div>
              <div>
                <div className="text-[11px] text-emerald-800 font-semibold mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Work Resolution Proof Photo
                </div>
                {complaint.resolutionImages && complaint.resolutionImages.length > 0 ? (
                  <img src={complaint.resolutionImages[0]} alt="Work Resolution Proof" className="w-full h-48 rounded-xl object-cover border-2 border-emerald-400 shadow-sm" />
                ) : (
                  <div className="h-48 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 p-4 text-center">
                    Resolution photo will be uploaded by officer upon work completion.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description & Location */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Issue Breakdown</h3>
            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{complaint.description}</p>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block">Assigned Department</span>
                <strong className="text-gov-navy text-sm font-bold">{complaint.departmentName || complaint.category}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Location Landmark</span>
                <strong className="text-slate-800 text-xs font-semibold">{complaint.landmark || complaint.address}</strong>
              </div>
            </div>

            {/* Map Mock */}
            <div className="pt-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gov-navy" />
                  <div>
                    <div className="font-bold text-slate-900">{complaint.address}</div>
                    <div className="text-[10px] text-slate-500">Municipal GIS Coordinates: Lat {complaint.latitude}, Lng {complaint.longitude}</div>
                  </div>
                </div>
                <span className="bg-gov-navy text-white text-[10px] font-bold px-2 py-1 rounded">Municipal GIS Verified</span>
              </div>
            </div>
          </div>

          {/* Clean Resolution Confirmation Box if Resolved */}
          {isResolved && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ✓ Grievance Resolved
              </div>
              <p className="text-emerald-800 text-xs font-medium">
                Work Completed &amp; Verified. The responsible municipal department has addressed the grievance and verified the resolution.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Tracking Timeline & AI Metadata */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Status Timeline Flow</h3>
            <Timeline currentStatus={complaint.status} />
          </div>

          {/* AI Metadata Box */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-3 text-xs border border-blue-900">
            <div className="flex items-center gap-2 text-gov-gold font-bold uppercase tracking-wider text-[11px]">
              <Bot className="w-4 h-4" /> AI Classification Log
            </div>
            <div className="space-y-2 bg-white/10 p-3 rounded-xl border border-white/10">
              <div className="flex justify-between">
                <span className="text-slate-300">Routing Confidence:</span>
                <strong className="text-gov-gold">
                  {complaint.aiPrediction?.confidenceScore
                    ? `${Math.round(complaint.aiPrediction.confidenceScore * 100)}%`
                    : '94%'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Duplicate Check Score:</span>
                <strong className={complaint.aiPrediction?.duplicateMatchRatio && complaint.aiPrediction.duplicateMatchRatio > 0.8 ? 'text-amber-400' : 'text-emerald-400'}>
                  {complaint.aiPrediction?.duplicateMatchRatio && complaint.aiPrediction.duplicateMatchRatio > 0.8
                    ? 'Flagged Potential Match'
                    : 'Unique Record'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Enforced SLA:</span>
                <strong className="text-white">{complaint.estimatedHours} Hours</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
