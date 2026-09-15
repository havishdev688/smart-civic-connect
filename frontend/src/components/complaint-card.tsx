import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Clock, AlertTriangle, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Complaint, Priority, Status } from '../types';

export function getStatusBadge(status: Status) {
  switch (status) {
    case 'NEW':
      return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">New</span>;
    case 'AI_PROCESSING':
      return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200 animate-pulse">AI Processing</span>;
    case 'ASSIGNED':
      return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">Assigned</span>;
    case 'IN_PROGRESS':
      return <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">In Progress</span>;
    case 'RESOLVED':
      return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved</span>;
    default:
      return <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
  }
}

export function getPriorityBadge(priority: Priority) {
  switch (priority) {
    case 'EMERGENCY':
      return <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Emergency</span>;
    case 'HIGH':
      return <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">High</span>;
    case 'MEDIUM':
      return <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Medium</span>;
    default:
      return <span className="bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Low</span>;
  }
}

interface ComplaintCardProps {
  complaint: Complaint;
  hrefPrefix?: string;
}

export default function ComplaintCard({ complaint, hrefPrefix = '/citizen/complaints' }: ComplaintCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-gov-navy bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{complaint.complaintNo}</span>
            {getStatusBadge(complaint.status)}
          </div>
          {getPriorityBadge(complaint.priority)}
        </div>

        <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-gov-navy transition-colors mb-1.5">
          {complaint.title}
        </h3>

        <p className="text-slate-600 text-xs line-clamp-2 mb-3 leading-relaxed">
          {complaint.description}
        </p>

        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gov-navy shrink-0" />
            <span className="truncate">{complaint.address}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>SLA: {complaint.estimatedHours}h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
        <div className="flex items-center gap-1 text-slate-700 font-semibold">
          <ShieldCheck className="w-4 h-4 text-gov-navy" />
          <span>{complaint.departmentName}</span>
        </div>
        <Link
          href={`${hrefPrefix}/${complaint.id}`}
          className="text-gov-navy font-bold hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
        >
          View Details <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
