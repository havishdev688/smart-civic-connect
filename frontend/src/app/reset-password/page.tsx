'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, KeyRound, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      const tokenParam = urlParams.get('token');

      if (emailParam) setEmail(decodeURIComponent(emailParam));
      if (tokenParam) setToken(tokenParam);
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !token) {
      setErrorMsg('Missing email or reset token. Please request a new password reset link.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password.');
      }

      setSuccessMsg(data.message || 'Password updated successfully!');
      setTimeout(() => {
        window.location.href = `/login?success=${encodeURIComponent('Password reset successful. Please log in with your new password.')}`;
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password.');
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
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Set New Password</h2>
          <p className="text-blue-100 text-xs">Citizen Account Recovery • Smart Civic Connect</p>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Account Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Reset token"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Confirm New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gov-navy hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Log In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link href="/login" className="text-gov-navy font-bold hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
