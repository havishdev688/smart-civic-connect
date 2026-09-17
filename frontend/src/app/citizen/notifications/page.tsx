'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('scc_token');
        let userId = '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.id;
          } catch (e) {}
        }

        const url = userId 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?userId=${userId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" /> {t('notif.title', 'Grievance Alerts & Notifications')}
          </h1>
          <p className="text-slate-500 text-xs">{t('notif.subtitle', 'Real-time status updates and department notifications from PostgreSQL database.')}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium text-xs">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Bell className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-sm">{t('notif.emptyTitle', 'No notifications yet')}</h3>
          <p className="text-slate-500 text-xs">{t('notif.emptyDesc', 'You will receive alerts here whenever your grievances are lodged, assigned, or updated by municipal officers.')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                !n.isRead ? 'bg-amber-50/60 border-amber-200 shadow-sm' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  {n.type === 'RESOLVED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : n.type === 'SUBMITTED' ? (
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  {n.title}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed pl-6">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
