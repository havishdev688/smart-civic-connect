'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Bot, HardHat, Droplets, Trash2, Zap, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-r from-gov-darkNavy via-gov-navy to-gov-deep text-white py-16 px-4 sm:px-8 border-b-4 border-gov-gold overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-12 text-center max-w-4xl mx-auto space-y-6 flex flex-col items-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {t('home.heroTitle1', 'Smart Civic Connect')} <br />
              <span className="text-gov-gold">{t('home.heroTitle2', 'Grievance Redressal System')}</span>
            </h1>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl text-center">
              {t('home.heroDesc', 'Report potholes, water leakages, streetlight failures, or sanitation issues directly to municipal departments. Our AI engine automatically classifies department, sets resolution SLA, and dispatches field officers.')}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 justify-center">
              <Link
                href="/citizen/report"
                className="bg-gov-gold hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 text-sm transition-transform transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-5 h-5" />
                {t('home.reportNow', 'Report Civic Grievance Now')}
              </Link>
              <Link
                href="/citizen/complaints"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl border border-white/30 flex items-center gap-2 text-sm transition-colors"
              >
                <Search className="w-5 h-5 text-gov-gold" />
                {t('home.trackStatus', 'Track Complaint Status')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-gov-navy font-bold text-xs uppercase tracking-wider">{t('home.servicesBadge', 'Civic Redressal Categories')}</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('home.servicesHeading', 'Key Municipal Services Supported')}</h2>
          <p className="text-slate-600 text-xs sm:text-sm">{t('home.servicesSub', 'Smart Civic Connect handles all urban municipal complaints with enforced time-bound SLAs.')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-gov-navy transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HardHat className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">{t('dept.roads', 'Roads & Asphalt')}</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-3">{t('dept.roadsDesc', 'Potholes, broken tar, pavement damage & footpath repairs.')}</p>
            <span className="text-[11px] font-bold text-gov-navy">{t('sla.target', 'Target SLA')}: 48 {t('sla.hours', 'Hours')}</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-gov-navy transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">{t('dept.water', 'Water Supply')}</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-3">{t('dept.waterDesc', 'Pipeline bursts, contaminated water & emergency tanker requests.')}</p>
            <span className="text-[11px] font-bold text-gov-navy">{t('sla.target', 'Target SLA')}: 24 {t('sla.hours', 'Hours')}</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-gov-navy transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">{t('dept.sanitation', 'Sanitation & Health')}</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-3">{t('dept.sanitationDesc', 'Garbage dump clearing, street sweeping & vector control.')}</p>
            <span className="text-[11px] font-bold text-gov-navy">{t('sla.target', 'Target SLA')}: 24 {t('sla.hours', 'Hours')}</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-gov-navy transition-all group">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">{t('dept.lighting', 'Street Lighting')}</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-3">{t('dept.lightingDesc', 'Dark streets, non-functional LED poles & loose wiring.')}</p>
            <span className="text-[11px] font-bold text-gov-navy">{t('sla.target', 'Target SLA')}: 12 {t('sla.hours', 'Hours')}</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="bg-slate-100 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-gov-navy font-bold text-xs uppercase tracking-wider">{t('howItWorks.badge', 'Transparent Process')}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('howItWorks.heading', 'How Grievances are Resolved')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-gov-navy text-white font-extrabold flex items-center justify-center mx-auto text-sm">1</div>
              <h4 className="font-bold text-sm text-slate-900">{t('howItWorks.step1Title', 'Report Grievance')}</h4>
              <p className="text-slate-600 text-xs">{t('howItWorks.step1Desc', 'Citizen uploads photo, title & enables GPS location.')}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-gov-gold text-slate-950 font-extrabold flex items-center justify-center mx-auto text-sm">2</div>
              <h4 className="font-bold text-sm text-slate-900">{t('howItWorks.step2Title', 'AI Routing & SLA')}</h4>
              <p className="text-slate-600 text-xs">{t('howItWorks.step2Desc', 'AI auto-assigns department, priority & checks for duplicates.')}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-gov-navy text-white font-extrabold flex items-center justify-center mx-auto text-sm">3</div>
              <h4 className="font-bold text-sm text-slate-900">{t('howItWorks.step3Title', 'Officer Action')}</h4>
              <p className="text-slate-600 text-xs">{t('howItWorks.step3Desc', 'Department officer reviews, dispatches team & resolves issue.')}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-sm">4</div>
              <h4 className="font-bold text-sm text-slate-900">{t('howItWorks.step4Title', 'Verification & Feedback')}</h4>
              <p className="text-slate-600 text-xs">{t('howItWorks.step4Desc', 'Officer uploads photo proof. Citizen rates satisfaction.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PrajaSevak Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-gradient-to-r from-gov-darkNavy via-gov-navy to-gov-deep text-white rounded-2xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-gov-gold">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-gov-gold text-slate-950 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase">
              <Bot className="w-3.5 h-3.5" /> {t('chatbot.bannerBadge', 'PrajaSevak AI Chatbot')}
            </div>
            <h3 className="text-2xl font-extrabold">{t('chatbot.bannerTitle', 'Need Help Lodging a Complaint?')}</h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              {t('chatbot.bannerDesc', 'Chat with PrajaSevak, our official AI assistant available in English and Telugu to help you navigate civic services.')}
            </p>
          </div>
          <Link
            href="/chatbot"
            className="bg-gov-gold hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl shadow shrink-0 text-sm flex items-center gap-2 transition-transform transform hover:scale-105"
          >
            {t('chatbot.launchBtn', 'Launch Chatbot')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
