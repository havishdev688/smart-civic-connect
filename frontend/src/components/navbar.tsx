'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, User, LogOut, Bell, LayoutDashboard, PlusCircle, FileText, MessageSquare, Menu, X, BarChart3, Building2, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Role } from '../types';
import { useLanguage } from '@/context/language-context';
import { getAuthenticatedUser, getUserInitial, logoutUser } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const syncAuth = () => {
    const authUser = getAuthenticatedUser();
    if (authUser) {
      setUserRole(authUser.role);
      setUserName(authUser.name);
    } else {
      setUserRole(null);
      setUserName('');
    }
  };

  useEffect(() => {
    syncAuth();

    const onAuthChange = () => syncAuth();
    window.addEventListener('scc_auth_change', onAuthChange);
    window.addEventListener('storage', onAuthChange);

    return () => {
      window.removeEventListener('scc_auth_change', onAuthChange);
      window.removeEventListener('storage', onAuthChange);
    };
  }, [pathname]);

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Official Top Bar */}
      <div className="bg-gov-darkNavy text-white text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-blue-900/50">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-medium">
            {t('nav.topHeading', 'Municipal Administration & Urban Development')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <Link href="/chatbot" className="hover:text-gov-gold flex items-center gap-1 transition-colors">
            <MessageSquare className="w-3 h-3 text-gov-gold" />
            <span>{t('nav.prajasevak', 'PrajaSevak AI Chatbot')}</span>
          </Link>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={toggleLanguage}
            className="hover:text-gov-gold cursor-pointer font-bold flex items-center gap-1.5 transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded text-[11px]"
            title="Switch Language / భాషను మార్చండి"
          >
            <Globe className="w-3 h-3 text-gov-gold" />
            <span className={language === 'EN' ? 'font-extrabold text-white' : 'text-slate-300'}>English</span>
            <span>/</span>
            <span className={language === 'TE' ? 'font-extrabold text-gov-gold' : 'text-slate-300'}>తెలుగు</span>
          </button>
        </div>
      </div>

      {/* Main Government Navbar */}
      <nav className="bg-gov-navy text-white px-4 sm:px-8 py-3 flex justify-between items-center shadow-lg border-b border-blue-900/30">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-white text-gov-navy flex items-center justify-center font-extrabold text-xl shadow-inner group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-gov-navy" />
          </div>
          <div>
            <div className="font-extrabold text-lg sm:text-xl tracking-tight flex items-center gap-2 text-white">
              {t('nav.brandTitle', 'SMART CIVIC CONNECT')}
            </div>
            <div className="text-[11px] text-blue-200 font-medium tracking-wide">
              {t('nav.brandSubtitle', 'Citizen Grievance Redressal Portal')}
            </div>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 font-medium text-sm text-slate-100">
          <Link href="/#home" className="hover:text-gov-gold transition-colors">{t('nav.home', 'Home')}</Link>
          <Link href="/#departments" className="hover:text-gov-gold transition-colors">{t('nav.departments', 'Departments')}</Link>
          <Link href="/#how-it-works" className="hover:text-gov-gold transition-colors">{t('nav.howItWorks', 'How It Works')}</Link>
          <Link href="/chatbot" className="hover:text-gov-gold transition-colors flex items-center gap-1.5 text-gov-gold font-bold">
            <MessageSquare className="w-4 h-4" />
            {t('nav.prajasevak', 'PrajaSevak AI Chatbot')}
          </Link>

          {userRole ? (
            <div className="flex items-center gap-3 pl-4 border-l border-blue-800">
              {userRole === 'CITIZEN' && (
                <>
                  <Link href="/citizen/dashboard" className="hover:text-gov-gold flex items-center gap-1.5 bg-blue-900/60 px-3 py-1.5 rounded-md border border-blue-700 font-bold text-white">
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard', 'Dashboard')}
                  </Link>
                  <Link href="/citizen/report" className="bg-gov-gold hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-md shadow flex items-center gap-1.5 transition-all">
                    <PlusCircle className="w-4 h-4" />
                    {t('nav.reportIssue', 'Report Issue')}
                  </Link>
                </>
              )}

              {userRole === 'OFFICER' && (
                <Link href="/officer/dashboard" className="hover:bg-amber-400 flex items-center gap-1.5 bg-gov-gold text-slate-950 font-bold px-3.5 py-1.5 rounded-md shadow">
                  <Building2 className="w-4 h-4" />
                  {t('nav.officerPortal', 'Officer Portal')}
                </Link>
              )}

              {userRole === 'ADMIN' && (
                <Link href="/admin/dashboard" className="hover:bg-amber-400 flex items-center gap-1.5 bg-gov-gold text-slate-950 font-bold px-3.5 py-1.5 rounded-md shadow">
                  <BarChart3 className="w-4 h-4" />
                  {t('nav.adminPortal', 'Admin Portal')}
                </Link>
              )}

              <div className="flex items-center gap-2 pl-2">
                <div 
                  className="w-8 h-8 rounded-full bg-white text-gov-navy border border-blue-400 flex items-center justify-center text-xs font-bold shadow select-none"
                  title={userName ? `Logged in as ${userName}` : 'User Profile'}
                >
                  {getUserInitial(userName) ? (
                    <span>{getUserInitial(userName)}</span>
                  ) : (
                    <User className="w-4 h-4 text-gov-navy" />
                  )}
                </div>
                <button onClick={handleLogout} className="text-slate-300 hover:text-red-300 p-1 rounded transition-colors" title={t('nav.logout', 'Logout')}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-blue-800">
              <Link href="/login" className="px-4 py-1.5 text-sm font-semibold rounded-md border border-white/30 text-white hover:bg-white/10 transition-colors">
                {t('nav.login', 'Login')}
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm font-bold bg-gov-gold hover:bg-amber-400 text-slate-950 rounded-md shadow transition-colors">
                {t('nav.register', 'Register Citizen')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-white p-2">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-gov-darkNavy text-white px-6 py-4 border-t border-blue-800 space-y-3 font-medium text-sm">
          <Link href="/#home" className="block py-1 hover:text-gov-gold">{t('nav.home', 'Home')}</Link>
          <Link href="/#departments" className="block py-1 hover:text-gov-gold">{t('nav.departments', 'Departments')}</Link>
          <Link href="/#how-it-works" className="block py-1 hover:text-gov-gold">{t('nav.howItWorks', 'How It Works')}</Link>
          <Link href="/chatbot" className="block py-1 text-gov-gold font-bold">{t('nav.prajasevak', 'PrajaSevak AI Chatbot')}</Link>
          {userRole ? (
            <div className="pt-3 border-t border-blue-800 space-y-2">
              <div className="flex items-center gap-2.5 py-1">
                <div 
                  className="w-7 h-7 rounded-full bg-white text-gov-navy border border-blue-400 flex items-center justify-center text-xs font-bold shadow shrink-0 select-none"
                >
                  {getUserInitial(userName) ? (
                    <span>{getUserInitial(userName)}</span>
                  ) : (
                    <User className="w-3.5 h-3.5 text-gov-navy" />
                  )}
                </div>
                <div className="text-xs text-blue-300 font-semibold uppercase">
                  Logged in as {userName || userRole} ({userRole})
                </div>
              </div>
              {userRole === 'CITIZEN' && <Link href="/citizen/dashboard" className="block py-1">{t('nav.citizenDashboard', 'Citizen Dashboard')}</Link>}
              {userRole === 'OFFICER' && <Link href="/officer/dashboard" className="block py-1">{t('nav.officerDashboard', 'Officer Dashboard')}</Link>}
              {userRole === 'ADMIN' && <Link href="/admin/dashboard" className="block py-1">{t('nav.adminDashboard', 'Admin Dashboard')}</Link>}
              <button onClick={handleLogout} className="block w-full text-left py-1 text-red-400 font-bold">{t('nav.logout', 'Logout')}</button>
            </div>
          ) : (
            <div className="pt-3 border-t border-blue-800 flex flex-col gap-2">
              <Link href="/login" className="block text-center py-2 bg-blue-900 rounded">{t('nav.login', 'Login')}</Link>
              <Link href="/register" className="block text-center py-2 bg-gov-gold text-slate-950 font-bold rounded">{t('nav.register', 'Register Citizen')}</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
