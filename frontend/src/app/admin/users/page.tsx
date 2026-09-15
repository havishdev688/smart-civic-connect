'use client';

import React from 'react';
import { Users, ShieldCheck, Mail, Phone, Building2 } from 'lucide-react';

export default function UsersPage() {
  const users = [
    { id: '1', name: 'Sri K. V. Rama Rao', email: 'admin@smartcivicconnect.in', role: 'ADMIN', department: 'Municipal Administration', phone: '+91 98765 00001' },
    { id: '2', name: 'Er. N. Suresh Babu', email: 'officer.roads@smartcivicconnect.in', role: 'OFFICER', department: 'Roads & Engineering', phone: '+91 98765 00002' },
    { id: '3', name: 'Dr. M. Gayatri', email: 'officer.sanitation@smartcivicconnect.in', role: 'OFFICER', department: 'Sanitation & Public Health', phone: '+91 98765 00003' },
    { id: '4', name: 'P. Venkat Reddy', email: 'citizen@example.com', role: 'CITIZEN', department: 'N/A (Citizen)', phone: '+91 98765 43210' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">User & Role Management</h1>
        <p className="text-slate-600 text-xs sm:text-sm">Manage Citizens, Department Officers, and Administrator privileges.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900">{u.name}</td>
                <td className="p-4 text-slate-600">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'OFFICER' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-slate-700">{u.department}</td>
                <td className="p-4 text-slate-500">{u.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
