'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, PhoneCall, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-300 pt-12 pb-6 border-t-4 border-gov-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-extrabold text-lg">
            <div className="w-8 h-8 rounded bg-gov-navy flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            Smart Civic Connect
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            {t('nav.topHeading', 'Municipal Administration & Urban Development')}. Enhancing civic transparency and fast complaint resolution.
          </p>
          <div className="text-xs text-gov-gold font-semibold pt-1">
            PrajaSevak AI Engine v2.0 Active
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-white font-bold text-base mb-3 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            {t('footer.quickNav', 'Quick Navigation')}
          </h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-gov-gold transition-colors">{t('footer.home', 'Home Portal')}</Link></li>
            <li><Link href="/citizen/report" className="hover:text-gov-gold transition-colors">{t('footer.report', 'Report Civic Grievance')}</Link></li>
            <li><Link href="/citizen/complaints" className="hover:text-gov-gold transition-colors">{t('footer.track', 'Track Complaint Status')}</Link></li>
            <li><Link href="/chatbot" className="hover:text-gov-gold transition-colors">{t('footer.assistant', 'PrajaSevak AI Assistant')}</Link></li>
            <li><Link href="/login" className="hover:text-gov-gold transition-colors">{t('footer.officerLogin', 'Department Officer Login')}</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-white font-bold text-base mb-3 border-b border-slate-800 pb-2">
            {t('footer.departments', 'Municipal Departments')}
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>{t('dept.roads', 'Roads & Asphalt')} (48h SLA)</li>
            <li>{t('dept.water', 'Water Supply')} (24h SLA)</li>
            <li>{t('dept.sanitation', 'Sanitation & Health')} (24h SLA)</li>
            <li>{t('dept.lighting', 'Street Lighting')} (12h SLA)</li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-white font-bold text-base mb-3 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-gov-gold" />
            {t('footer.support', 'Emergency & Support')}
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <PhoneCall className="w-4 h-4 text-gov-gold shrink-0 mt-0.5" />
              <span>{t('footer.helpline', 'Emergency Services:')} <strong>112</strong> / 100 / 101 / 108</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-gov-gold shrink-0 mt-0.5" />
              <span>support@smartcivicconnect.in</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gov-gold shrink-0 mt-0.5" />
              <span>{t('nav.topHeading', 'Municipal Administration & Urban Development')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
        <div>
          {t('footer.copyright', '© 2026 Municipal Administration & Urban Development. Smart Civic Connect (SCC) Platform. All rights reserved.')}
        </div>
        <div className="flex gap-4">
          <Link href="/privacy-policy" className="hover:underline cursor-pointer">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms-of-service" className="hover:underline cursor-pointer">Terms of Service</Link>
          <span>•</span>
          <span className="hover:underline cursor-pointer">Accessibility</span>
        </div>
      </div>
    </footer>
  );
}
