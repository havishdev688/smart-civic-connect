'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Role } from '../../types';
import { useLanguage } from '@/context/language-context';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CITIZEN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Sub-view for Citizen Forgot Password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Handle URL message parameters on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const err = urlParams.get('error');
      const success = urlParams.get('success');

      if (err) {
        setErrorMsg(decodeURIComponent(err));
      } else if (success) {
        setInfoMsg(decodeURIComponent(success));
      }
    }
  }, []);

  // Standard Email/Mobile + Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials. Please check your email/mobile and password.');
      }

      localStorage.setItem('scc_role', data.user.role);
      localStorage.setItem('scc_user_name', data.user.name);
      localStorage.setItem('scc_token', data.token);

      if (data.user.role === 'CITIZEN') window.location.href = '/citizen/dashboard';
      else if (data.user.role === 'OFFICER') window.location.href = '/officer/dashboard';
      else if (data.user.role === 'ADMIN') window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please check your email/mobile and password.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || forgotEmail.trim() === '') {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to process password reset request.');
      }

      setInfoMsg(data.message || 'Password reset link has been dispatched to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gov-navy text-white p-6 text-center space-y-2 border-b-4 border-gov-gold">
          <div className="w-12 h-12 rounded-full bg-white text-gov-navy flex items-center justify-center mx-auto shadow font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">{t('auth.loginTitle', 'Smart Civic Connect Login')}</h2>
          <p className="text-blue-100 text-xs">{t('auth.loginSubtitle', 'Official Portal Login • Municipal Administration & Urban Development')}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRole('CITIZEN');
                setShowForgotPassword(false);
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-lg transition-all ${
                role === 'CITIZEN' ? 'bg-gov-navy text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('auth.citizenTab', 'Citizen')}
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('OFFICER');
                setShowForgotPassword(false);
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-lg transition-all ${
                role === 'OFFICER' ? 'bg-gov-navy text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('auth.officerTab', 'Officer')}
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setShowForgotPassword(false);
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-lg transition-all ${
                role === 'ADMIN' ? 'bg-gov-navy text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('auth.adminTab', 'Admin')}
            </button>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2 leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-start gap-2 leading-relaxed animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{infoMsg}</div>
            </div>
          )}

          {/* Citizen Forgot Password Sub-View */}
          {role === 'CITIZEN' && showForgotPassword ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 text-sm">Citizen Password Recovery</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-gov-navy font-bold flex items-center gap-1 hover:underline text-[11px]"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </button>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Enter your registered email address. A secure, single-use password reset link will be sent to your email.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="citizen@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gov-navy hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {loading ? 'Requesting Reset Link...' : 'Send Password Reset Link'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Standard Password Login Form */
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {role === 'CITIZEN' ? t('auth.citizenEmailMobile', 'Email Address or Mobile Number') : t('auth.officialEmail', 'Official Email Address')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'CITIZEN' ? 'Enter registered email or mobile...' : 'Enter official email...'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-700 font-bold">{t('auth.password', 'Password')}</label>
                  {role === 'CITIZEN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotEmail(email.includes('@') ? email : '');
                        setErrorMsg('');
                        setInfoMsg('');
                      }}
                      className="text-gov-navy hover:underline text-[11px] font-semibold"
                    >
                      {t('auth.forgotPassword', 'Forgot Password?')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gov-navy hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {loading ? t('auth.authenticating', 'Authenticating...') : `${t('auth.loginBtn', 'Login as')} ${role}`} <ArrowRight className="w-4 h-4" />
              </button>

              {/* Citizen Registration Link */}
              {role === 'CITIZEN' && (
                <div className="text-center pt-2 border-t border-slate-100 mt-3">
                  <Link href="/register" className="text-gov-navy font-bold hover:underline">
                    {t('auth.newCitizen', 'New citizen? Register here')}
                  </Link>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
