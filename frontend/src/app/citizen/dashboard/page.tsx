'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Clock, CheckCircle2, FileText, Bot, ChevronRight, Bell, ShieldCheck } from 'lucide-react';
import StatCard from '@/components/stat-card';
import ComplaintCard from '@/components/complaint-card';
import { Complaint } from '@/types';
import { useLanguage } from '@/context/language-context';
import { getAuthenticatedUser } from '@/lib/auth';

export default function CitizenDashboard() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userName, setUserName] = useState('Citizen');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUser = getAuthenticatedUser();
    if (authUser && authUser.name) {
      setUserName(authUser.name);
    }

    const fetchData = async () => {
      try {
        const currentUser = getAuthenticatedUser();
        const citizenId = currentUser?.id || '';

        if (!citizenId) {
          setComplaints([]);
          setNotifications([]);
          setLoading(false);
          return;
        }

        const [complaintsRes, notifRes] = await Promise.all([
          fetch(`http://localhost:5000/api/complaints?citizenId=${citizenId}`),
          fetch(`http://localhost:5000/api/notifications?userId=${citizenId}`),
        ]);

        if (complaintsRes.ok) {
          const data = await complaintsRes.json();
          setComplaints(data.complaints || []);
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gov-darkNavy via-gov-navy to-gov-deep text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-gov-gold">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-gov-gold text-slate-950 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase mb-2">
            {t('dashboard.portalBadge', 'Citizen Grievance Portal')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('dashboard.welcome', 'Namaste')}, {userName}</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            {t('dashboard.subtitle', 'Track active grievances or submit new civic issues for automatic AI department routing.')}
          </p>
        </div>

        <Link
          href="/citizen/report"
          className="bg-gov-gold hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs sm:text-sm shrink-0 transition-transform transform hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          {t('dashboard.reportNew', 'Report New Grievance')}
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title={t('dashboard.totalComplaints', 'Total Complaints Filed')}
          value={total}
          subtitle={t('dashboard.totalSub', 'Lifetime grievances registered')}
          icon={FileText}
          colorBg="bg-blue-100"
          colorText="text-blue-900"
        />
        <StatCard
          title={t('dashboard.activeComplaints', 'Active & In-Progress')}
          value={pending}
          subtitle={t('dashboard.activeSub', 'Currently assigned to field teams')}
          icon={Clock}
          colorBg="bg-amber-100"
          colorText="text-amber-800"
        />
        <StatCard
          title={t('dashboard.resolvedComplaints', 'Resolved Grievances')}
          value={resolved}
          subtitle={t('dashboard.resolvedSub', 'Completed with work verification')}
          icon={CheckCircle2}
          colorBg="bg-emerald-100"
          colorText="text-emerald-800"
        />
      </div>

      {/* Real Notifications Highlight */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" /> {t('dashboard.recentNotifs', 'Recent Grievance Notifications')}
            </h3>
            <Link href="/citizen/notifications" className="text-amber-600 hover:underline text-xs font-bold flex items-center gap-1">
              {t('dashboard.viewAll', 'View All')} ({notifications.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 2).map((n) => (
              <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-start gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> {n.title}
                  </div>
                  <div className="text-slate-600 text-[11px]">{n.message}</div>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Complaints */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{t('dashboard.recentGrievances', 'Your Recent Grievances')}</h2>
            <p className="text-slate-500 text-xs">{t('dashboard.recentSub', 'Real-time status updates and department assignments')}</p>
          </div>
          <Link href="/citizen/complaints" className="text-amber-600 font-bold text-xs hover:underline flex items-center gap-1">
            {t('dashboard.viewAll', 'View All')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500 font-medium text-xs">Loading...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t('dashboard.noComplaints', 'No grievances filed yet.')}</h3>
            <p className="text-slate-500 text-sm mb-4">{t('dashboard.noComplaintsSub', 'You have not submitted any complaints.')}</p>
            <Link
              href="/citizen/report"
              className="inline-flex bg-gov-gold hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg shadow transition"
            >
              {t('dashboard.reportNew', 'Report a Civic Issue')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {complaints.slice(0, 3).map((cmp) => (
              <ComplaintCard key={cmp.id} complaint={cmp} hrefPrefix="/citizen/complaints" />
            ))}
          </div>
        )}
      </div>

      {/* PrajaSevak Quick Prompt */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gov-gold text-slate-950 flex items-center justify-center font-bold shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">{t('dashboard.slaHelp', 'Need help understanding resolution SLAs?')}</h4>
            <p className="text-slate-600 text-xs">{t('dashboard.slaHelpDesc', 'PrajaSevak AI can answer questions about municipal timelines, officer assignments, or escalation.')}</p>
          </div>
        </div>
        <Link
          href="/chatbot"
          className="bg-gov-deep hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-lg text-xs shrink-0 transition-colors"
        >
          {t('dashboard.askPrajaSevak', 'Ask PrajaSevak AI →')}
        </Link>
      </div>
    </div>
  );
}
