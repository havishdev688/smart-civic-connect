'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, UserCheck, Bot } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/analytics/audit-logs');
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">System Audit Trail</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Complete immutable record of officer actions, status updates, and AI decisions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No audit logs recorded yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
                <th className="p-4">User / Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-500 font-mono">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-gov-navy font-bold px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{l.details}</td>
                  <td className="p-4 text-slate-600">{l.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
