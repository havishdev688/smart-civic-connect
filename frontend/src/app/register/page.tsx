'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';

function isDummyPhoneNumber(phone: string): boolean {
  if (phone.length !== 10) return true;
  if (/^(\d)\1{9}$/.test(phone)) return true;

  const knownDummies = new Set([
    '1234567890',
    '0123456789',
    '9876543210',
    '8765432109',
    '0987654321',
    '2345678901',
    '1010101010',
    '0101010101',
    '1212121212',
    '9898989898',
    '9090909090',
    '9999988888',
    '8888899999',
    '7777788888',
  ]);
  if (knownDummies.has(phone)) return true;

  const digits = phone.split('').map(Number);
  let isAscending = true;
  let isDescending = true;
  for (let i = 1; i < digits.length; i++) {
    if ((digits[i] - digits[i - 1] + 10) % 10 !== 1) isAscending = false;
    if ((digits[i - 1] - digits[i] + 10) % 10 !== 1) isDescending = false;
  }
  if (isAscending || isDescending) return true;

  return false;
}

function validateAndNormalizeIndianPhone(input: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Mobile number is required.' };
  }

  let cleaned = input.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Mobile number must contain digits only.' };
  }

  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.' };
  }

  if (isDummyPhoneNumber(cleaned)) {
    return { isValid: false, error: 'Please enter a valid Indian mobile number. Test or dummy numbers are not allowed.' };
  }

  return { isValid: true, normalized: cleaned };
}

export default function RegisterPage() {
  const { t, language } = useLanguage();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Direct Citizen Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setErrorMsg(language === 'TE' ? 'దయచేసి అన్ని వివరాలను పూరించండి.' : 'Please fill in all registration fields.');
      return;
    }

    // Validate Indian mobile number
    const phoneCheck = validateAndNormalizeIndianPhone(phone);
    if (!phoneCheck.isValid) {
      setErrorMsg(phoneCheck.error || 'Invalid mobile number.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg(language === 'TE' ? 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.' : 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(language === 'TE' ? 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు.' : 'Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phoneCheck.normalized || phone.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (language === 'TE' ? 'నమోదు విఫలమైంది.' : 'Registration failed.'));
      }

      // Save token and session
      localStorage.setItem('scc_role', data.user.role);
      localStorage.setItem('scc_user_name', data.user.name);
      localStorage.setItem('scc_token', data.token);

      window.location.href = '/citizen/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'TE' ? 'నమోదు లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Registration error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gov-navy text-white p-6 text-center space-y-2 border-b-4 border-gov-gold">
          <div className="w-12 h-12 rounded-full bg-white text-gov-navy flex items-center justify-center mx-auto shadow font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {t('auth.registerTitle', 'Citizen Registration')}
          </h2>
          <p className="text-blue-100 text-xs">
            {t('auth.registerSubtitle', 'Create your Smart Civic Connect Citizen Account')}
          </p>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Alerts */}
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

          {/* REGISTRATION FORM */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">{t('auth.fullName', 'Full Name (as in Aadhaar/Voter ID) *')}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. P. Venkat Reddy"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {t('auth.mobileNumber', 'Mobile Number *')}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number (e.g. 9876543210 / +91)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Valid 10-digit mobile starting with 6, 7, 8, or 9 (Validated contact number)</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{t('auth.emailAddress', 'Email Address *')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Enter a valid email address</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{t('auth.password', 'Password *')}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password (min 6 characters)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{language === 'TE' ? 'పాస్‌వర్డ్ నిర్ధారించండి *' : 'Confirm Password *'}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gov-navy hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
            >
              {loading
                ? (language === 'TE' ? 'ఖాతా సృష్టిస్తోంది...' : 'Creating Account...')
                : (language === 'TE' ? 'నమోదు చేయండి' : 'Register')} <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 text-slate-600">
              {t('auth.alreadyRegistered', 'Already registered? Login here')}{' '}
              <Link href="/login" className="text-gov-navy font-bold hover:underline">
                {t('nav.login', 'Login')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
