'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw
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
  
  // Step state: 1 = Details input, 2 = Email OTP verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Resend Timer Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Send Verification OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (language === 'TE' ? 'OTP పంపడం విఫలమైంది.' : 'Failed to dispatch verification code.'));
      }

      setNormalizedPhone(data.normalizedPhone || phoneCheck.normalized);
      setStep(2);
      setResendCooldown(60);
      setInfoMsg(data.message || `Verification OTP has been sent to ${email.trim().toLowerCase()}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting verification OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Email OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;

    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend verification OTP.');
      }

      setResendCooldown(60);
      setInfoMsg(language === 'TE' ? 'కొత్త OTP మీ ఈమెయిల్‌కు పంపబడింది.' : `A new verification code has been dispatched to ${email.trim().toLowerCase()}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Register Account
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg(language === 'TE' ? 'దయచేసి 6-అంకెల OTP కోడ్‌ను నమోదు చేయండి.' : 'Please enter the valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify Email OTP on Backend
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.message || (language === 'TE' ? 'OTP సరిపోలలేదు.' : 'Invalid or expired verification code.'));
      }

      const verificationToken = verifyData.verificationToken;

      // 2. Submit Final Registration with Backend Verification Proof
      const regRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizedPhone || phone.trim(),
          password,
          verificationToken,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        throw new Error(regData.message || (language === 'TE' ? 'నమోదు విఫలమైంది.' : 'Registration failed.'));
      }

      // Save token and session
      localStorage.setItem('scc_role', regData.user.role);
      localStorage.setItem('scc_user_name', regData.user.name);
      localStorage.setItem('scc_token', regData.token);

      window.location.href = '/citizen/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'TE' ? 'ధృవీకరణ లోపం. దయచేసి వివరాలను తనిఖీ చేయండి.' : 'Verification error. Please check your code.'));
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
            {step === 1 ? t('auth.registerTitle', 'Citizen Registration') : 'Verify Email Address'}
          </h2>
          <p className="text-blue-100 text-xs">
            {step === 1
              ? (language === 'TE' ? 'మీ స్మార్ట్ సివిక్ కనెక్ట్ ఖాతాను సృష్టించండి' : 'Create your Smart Civic Connect Citizen Account')
              : (language === 'TE' ? 'ఈమెయిల్ OTP ద్వారా ధృవీకరించండి' : 'Enter 6-digit OTP code sent to your email')}
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

          {step === 1 ? (
            /* STEP 1: ACCOUNT INFORMATION */
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                <label className="block text-slate-700 font-bold mb-1">{t('auth.emailAddress', 'Email Address (for OTP verification) *')}</label>
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
                <p className="text-[10px] text-slate-500 mt-1">A real 6-digit verification code will be dispatched to this email</p>
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
                {loading ? 'Sending Verification Code...' : 'Send Verification OTP'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-slate-600">
                {t('auth.alreadyRegistered', 'Already registered? Login here')}{' '}
                <Link href="/login" className="text-gov-navy font-bold hover:underline">
                  {t('nav.login', 'Login')}
                </Link>
              </div>
            </form>
          ) : (
            /* STEP 2: EMAIL OTP VERIFICATION */
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-1">
                <div className="text-gov-navy font-bold text-xs flex items-center justify-center gap-1.5">
                  <Mail className="w-4 h-4 text-gov-navy" /> Verification Code Dispatched
                </div>
                <p className="text-slate-600 text-xs">
                  We have sent a 6-digit code to <br />
                  <strong className="text-slate-900 font-semibold">{email.trim().toLowerCase()}</strong>
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-center">
                  Enter 6-Digit Email OTP *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-gov-navy text-center text-xl font-mono tracking-widest text-slate-900 font-bold bg-slate-50 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-1">
                  Code expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-gov-navy hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {loading ? 'Verifying & Creating Account...' : 'Verify OTP & Create Account'} <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit Details
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-gov-navy hover:underline font-bold disabled:text-slate-400 disabled:no-underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

