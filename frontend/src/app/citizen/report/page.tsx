'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Bot,
  ArrowRight,
  Upload,
  Trash2,
  RefreshCw,
  ExternalLink,
  Eye,
  LogIn
} from 'lucide-react';
import GoogleMap from '@/components/google-map';
import CameraModal from '@/components/camera-modal';
import { Priority } from '@/types';
import { useLanguage } from '@/context/language-context';

/**
 * Filter and remove internal safety/status metadata tags (e.g. "User Safety: safe")
 * while preserving the actual generated civic complaint description.
 */
function sanitizeAiDescription(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let cleaned = rawText;

  // 1. Remove bracketed / parenthetical safety tags
  cleaned = cleaned.replace(/\[\s*(?:user\s+)?safety\s*:[^\]]+\]/gi, '');
  cleaned = cleaned.replace(/\(\s*(?:user\s+)?safety\s*:[^\)]+\)/gi, '');

  // 2. Filter line by line to remove metadata lines
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const isSafetyLine = /^(?:[*_~`#>\s-]*)(?:user\s+)?safety(?:[\s_*-]*(?:assessment|rating|status|check|evaluation|result))?(?:[*_~`#>\s-]*):(?:[*_~`#>\s-]*)(?:safe|pass|none|low|acceptable|true|yes|clean|ok|n\/a)\.?(?:[*_~`#>\s-]*)$/i.test(trimmed);
    return !isSafetyLine;
  });

  cleaned = filteredLines.join('\n').trim();

  // 3. Remove inline safety prefix if present at start of a paragraph/sentence
  cleaned = cleaned.replace(/^(?:[*_~`#>\s-]*)(?:user\s+)?safety(?:[\s_*-]*(?:assessment|rating|status|check|evaluation|result))?(?:[*_~`#>\s-]*):(?:[*_~`#>\s-]*)(?:safe|pass|none|low|acceptable|true|yes|clean|ok|n\/a)\.?(?:[*_~`#>\s-]*)[\s,.-]*/i, '');

  // 4. Remove any trailing safety note at the end of the text
  cleaned = cleaned.replace(/\s*(?:[*_~`#>\s-]*)(?:user\s+)?safety(?:[\s_*-]*(?:assessment|rating|status|check|evaluation|result))?(?:[*_~`#>\s-]*):(?:[*_~`#>\s-]*)(?:safe|pass|none|low|acceptable|true|yes|clean|ok|n\/a)\.?(?:[*_~`#>\s-]*)$/i, '');

  // 5. Normalize multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned || rawText.trim();
}

export default function ReportComplaintPage() {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locality, setLocality] = useState('');
  const [district, setDistrict] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Department Selection State (Empty initial state until AI classifies or user selects)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isUserModifiedDept, setIsUserModifiedDept] = useState<boolean>(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [citizenId, setCitizenId] = useState<string | null>(null);

  // Real Image State (No demo / Unsplash defaults)
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAiDesc, setGeneratingAiDesc] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');

  // Duplicate Check Modal State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [existingDuplicate, setExistingDuplicate] = useState<any>(null);

  // File input ref & Camera Modal State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  // Live AI Inspection State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    departmentCode: string;
    departmentName: string;
    confidenceScore: number;
    priority: Priority;
    estimatedHours: number;
    summary: string;
  } | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('scc_token');
      const role = localStorage.getItem('scc_role');

      if (!token || role !== 'CITIZEN') {
        setIsLoggedIn(false);
        setCitizenId(null);
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCitizenId(payload.id);
          setIsLoggedIn(true);
        } catch (e) {
          setIsLoggedIn(false);
          setCitizenId(null);
        }
      }
    }
  }, []);

  // Handle Image Selection from Device
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(language === 'TE' ? 'చిత్రం పరిమాణం 10MB కంటే తక్కువగా ఉండాలి.' : 'Image size should be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setErrorMsg('');
      setInfoMsg(language === 'TE' ? 'ఫోటో సాక్ష్యం జతచేయబడింది.' : 'Photo evidence attached successfully.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Live Camera Photo Capture
  const handleCameraCapture = (base64: string) => {
    setImageBase64(base64);
    setErrorMsg('');
    setInfoMsg(language === 'TE' ? 'కెమెరా ద్వారా ఫోటో సాక్ష్యం జతచేయబడింది.' : 'Photo evidence captured from camera successfully.');
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate Description with AI Button
  const handleGenerateDescription = async () => {
    if (!imageBase64) {
      setErrorMsg(language === 'TE' ? 'దయచేసి ముందుగా ఫోటోను అప్‌లోడ్ చేయండి.' : 'Please upload an image first.');
      return;
    }

    setGeneratingAiDesc(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/complaints/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (language === 'TE' ? 'AI వివరణ రూపొందించడం విఫలమైంది.' : 'Failed to generate AI description.'));
      }

      if (data.description) {
        const cleanedDescription = sanitizeAiDescription(data.description);
        setDescription(cleanedDescription);
        setInfoMsg(language === 'TE' ? 'ఫోటో ఆధారంగా AI వివరణ రూపొందించబడింది.' : 'AI Description generated from photo. You can review and edit it before submitting.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'TE' ? 'AI వివరణ సేవ అందుబాటులో లేదు.' : 'AI description generation unavailable.'));
    } finally {
      setGeneratingAiDesc(false);
    }
  };

  // Live AI Classification
  useEffect(() => {
    const fetchPreview = async () => {
      if (title.trim().length > 2 || description.trim().length > 4 || imageBase64) {
        setIsAiAnalyzing(true);
        try {
          const res = await fetch('http://localhost:5000/api/complaints/analyze-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              description,
              hasImages: !!imageBase64,
              image: imageBase64 || undefined
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setAiResult({
              departmentCode: data.departmentCode,
              departmentName: data.departmentName,
              confidenceScore: data.confidenceScore,
              priority: data.priority,
              estimatedHours: data.estimatedHours,
              summary: data.summary,
            });

            if (!isUserModifiedDept && data.departmentCode && data.departmentCode !== 'UNCLASSIFIED') {
              setSelectedDepartment(data.departmentCode);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsAiAnalyzing(false);
        }
      } else {
        setAiResult(null);
        setIsAiAnalyzing(false);
        if (!isUserModifiedDept) {
          setSelectedDepartment('');
        }
      }
    };

    const timeoutId = setTimeout(() => {
      fetchPreview();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [title, description, imageBase64]);

  // GPS Location Detection & Reverse Geocoding
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg(language === 'TE' ? 'మీ బ్రౌజర్ జియోలొకేషన్‌కు మద్దతు ఇవ్వదు.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setErrorMsg('');
    setInfoMsg(language === 'TE' ? 'ఖచ్చితమైన GPS స్థానాన్ని పొందుతోంది...' : 'Acquiring high-accuracy GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = parseFloat(pos.coords.latitude.toFixed(5));
        const longitude = parseFloat(pos.coords.longitude.toFixed(5));
        setLat(latitude);
        setLng(longitude);
        setLocationDetected(true);

        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const road = addr.road || addr.street || '';
            const sub = addr.suburb || addr.neighbourhood || addr.residential || '';
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const stateDist = addr.state_district || addr.district || '';

            setLocality(sub || city);
            setDistrict(stateDist || 'Urban District');

            const fullFormatted = geoData.display_name || [road, sub, city, stateDist].filter(Boolean).join(', ') || 'Municipal Area';
            setAddress(fullFormatted);
            setInfoMsg(language === 'TE' ? `GPS స్థానం గుర్తించబడింది: ${city || road || 'మున్సిపల్ ప్రాంతం'}` : `GPS Location detected: ${city || road || 'Municipal Area'}`);
          } else {
            setAddress(`Coordinates: ${latitude}, ${longitude}`);
            setInfoMsg(language === 'TE' ? 'GPS స్థానాన్ని గుర్తించబడింది.' : 'GPS coordinates captured.');
          }
        } catch (err) {
          setAddress(`Coordinates: ${latitude}, ${longitude}`);
          setInfoMsg(language === 'TE' ? 'GPS స్థానాన్ని గుర్తించబడింది.' : 'GPS coordinates captured.');
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        if (err.code === 1) {
          setErrorMsg(language === 'TE' ? 'లొకేషన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్‌లో అనుమతించండి లేదా చిరునామాను నమోదు చేయండి.' : 'Location permission denied. Please enable location access in your browser or enter the address manually.');
        } else if (err.code === 2) {
          setErrorMsg(language === 'TE' ? 'GPS అందుబాటులో లేదు. దయచేసి చిరునామాను మాన్యువల్‌గా నమోదు చేయండి.' : 'GPS position unavailable. Please enter the address manually.');
        } else {
          setErrorMsg(language === 'TE' ? `GPS లొకేషన్ పొందలేకపోయాము: ${err.message}` : `Unable to retrieve GPS location: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent, forceDuplicateOfId?: string) => {
    if (e) e.preventDefault();

    // Enforce Citizen Authentication
    if (!isLoggedIn || !citizenId) {
      setErrorMsg(t('report.authRequiredDesc', 'Please log in as a citizen to lodge and track your civic complaints.'));
      return;
    }

    if (!title.trim() || !description.trim()) {
      setErrorMsg(language === 'TE' ? 'సమస్య శీర్షిక మరియు వివరణ తప్పనిసరి.' : 'Grievance title and detailed description are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Check for Duplicate Complaint if not already confirmed
      if (!forceDuplicateOfId) {
        const dupRes = await fetch('http://localhost:5000/api/complaints/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            departmentCode: selectedDepartment,
            latitude: lat,
            longitude: lng,
          }),
        });

        if (dupRes.ok) {
          const dupData = await dupRes.json();
          if (dupData.isDuplicate && dupData.existingComplaint) {
            setExistingDuplicate(dupData.existingComplaint);
            setDuplicateModalOpen(true);
            setSubmitting(false);
            return;
          }
        }
      }

      // 2. Submit Complaint to Database
      const res = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          departmentCode: selectedDepartment,
          latitude: lat,
          longitude: lng,
          address: address.trim() || 'Municipal Area',
          landmark: landmark.trim() || undefined,
          images: imageBase64 ? [imageBase64] : [],
          citizenId,
          duplicateOfId: forceDuplicateOfId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (language === 'TE' ? 'ఫిర్యాదు సమర్పించడం విఫలమైంది.' : 'Failed to submit grievance.'));
      }

      setSubmittedSuccess(data.complaint.complaintNo);
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'TE' ? 'ఫిర్యాదు సమర్పించడం విఫలమైంది.' : 'Failed to submit grievance.'));
    } finally {
      setSubmitting(false);
    }
  };

  const DEPT_SLA: Record<string, number> = {
    ROADS_ASPHALT: 48,
    WATER_SUPPLY: 24,
    SANITATION_HEALTH: 24,
    STREET_LIGHTING: 12,
  };
  const currentSla =
    aiResult && !isUserModifiedDept && aiResult.departmentCode === selectedDepartment
      ? aiResult.estimatedHours
      : DEPT_SLA[selectedDepartment] || 48;

  // Helper for department translation
  const getTranslatedDept = (deptCode?: string, defaultName?: string) => {
    if (deptCode === 'ROADS_ASPHALT') return t('dept.roads', 'Roads & Asphalt');
    if (deptCode === 'WATER_SUPPLY') return t('dept.water', 'Water Supply');
    if (deptCode === 'SANITATION_HEALTH') return t('dept.sanitation', 'Sanitation & Health');
    if (deptCode === 'STREET_LIGHTING') return t('dept.lighting', 'Street Lighting');
    return defaultName || t('report.unclassified', 'Classification unavailable');
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">{t('report.successTitle', 'Grievance Lodged Successfully!')}</h2>
        <p className="text-slate-600 text-sm">
          {t('report.complaintNoPrefix', 'Your complaint reference number is')}{' '}
          <strong className="text-gov-navy font-mono text-base">{submittedSuccess}</strong>
        </p>
        <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 space-y-1.5 text-left border border-slate-200">
          <div>• {t('report.aiDept', 'Department:')} <strong>{getTranslatedDept(selectedDepartment)}</strong></div>
          <div>• {t('report.targetSla', 'Resolution SLA Target:')} <strong>{currentSla} {t('sla.hours', 'Hours')}</strong></div>
          <div>• {t('report.priority', 'Priority Tag:')} <strong>{aiResult?.priority || 'MEDIUM'}</strong></div>
          <div>• {t('report.locationSidebar', 'Location:')} <strong>{address || (locationDetected && lat !== null && lng !== null ? `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : (language === 'TE' ? 'GPS గుర్తించడానికి వేచి ఉంది' : 'Pending GPS detection'))}</strong></div>
        </div>
        <div className="flex gap-4 justify-center pt-2">
          <Link href="/citizen/dashboard" className="bg-gov-navy hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow">
            {t('report.goToDashboard', 'Go to Citizen Dashboard')}
          </Link>
          <button
            onClick={() => {
              setSubmittedSuccess(null);
              setTitle('');
              setDescription('');
              setImageBase64(null);
              setIsUserModifiedDept(false);
              setSelectedDepartment('');
            }}
            className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-200"
          >
            {t('report.reportAnother', 'Report Another Issue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 bg-white min-h-[85vh]">
      <div>
        <span className="text-gov-secondary font-bold text-xs uppercase tracking-wider">{t('report.wizard', 'Citizen Service Wizard')}</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('report.title', 'Report a Civic Grievance')}</h1>
        <p className="text-slate-600 text-xs sm:text-sm">
          {t('report.subtitle', 'Provide issue details and photo evidence. AI automatically assigns the responsible department.')}
        </p>
      </div>

      {/* Unauthenticated Alert Banner */}
      {!isLoggedIn && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-sm">{t('report.authRequiredTitle', 'Citizen Login Required')}</div>
              <div className="text-xs text-amber-800">{t('report.authRequiredDesc', 'Please log in as a citizen to lodge and track your civic complaints.')}</div>
            </div>
          </div>
          <Link
            href="/login?redirect=/citizen/report"
            className="bg-gov-navy hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow"
          >
            <LogIn className="w-4 h-4" /> {t('report.loginToContinue', 'Log In to Continue')}
          </Link>
        </div>
      )}

      {/* Duplicate Modal Dialog */}
      {duplicateModalOpen && existingDuplicate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Possible Duplicate Complaint</h3>
              <p className="text-xs text-slate-500">
                An active complaint matching this exact title and GPS location was found in the database.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{existingDuplicate.title}</div>
              <div className="text-slate-500 text-[11px]">Reference: <span className="font-mono font-bold text-slate-700">{existingDuplicate.complaintNo}</span></div>
              <div className="text-slate-500 text-[11px]">Department: <span className="font-semibold text-slate-700">{existingDuplicate.departmentName}</span></div>
              <div className="text-slate-500 text-[11px]">Status: <span className="font-semibold text-amber-600">{existingDuplicate.status}</span></div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/citizen/complaints/${existingDuplicate.id}`}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> View Existing
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDuplicateModalOpen(false);
                  handleSubmit(null as any, existingDuplicate.id);
                }}
                className="flex-1 bg-gov-navy hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Grievance Form */}
        <form onSubmit={(e) => handleSubmit(e)} className="lg:col-span-7 bg-gov-cardBg p-6 sm:p-8 rounded-2xl border border-gov-border shadow-sm space-y-6 text-xs">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{infoMsg}</div>
            </div>
          )}

          {/* Grievance Title */}
          <div>
            <label className="block text-slate-800 font-bold mb-1.5 text-sm">{t('report.grievanceTitle', 'Grievance Title *')}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('report.titlePlaceholder', 'e.g., Deep pothole near signal causing traffic risk')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-900 text-xs sm:text-sm font-medium bg-white"
            />
          </div>

          {/* Photo Evidence (Real Camera + File Upload) */}
          <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="block text-slate-800 font-bold text-sm">{t('report.photoEvidence', 'Complaint Photo Evidence')}</label>
              {imageBase64 && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-red-200 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t('report.removePhoto', 'Remove')}
                </button>
              )}
            </div>

            {imageBase64 ? (
              <div className="relative group rounded-xl overflow-hidden border-2 border-blue-400 w-full max-w-sm h-48 bg-slate-900 shadow-md">
                <img src={imageBase64} alt="Complaint Evidence" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow flex items-center gap-1 hover:bg-slate-100"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {t('report.replacePhoto', 'Replace File')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraModalOpen(true)}
                    className="bg-gov-navy text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow flex items-center gap-1 hover:bg-blue-800"
                  >
                    <Camera className="w-3.5 h-3.5" /> {language === 'TE' ? 'మళ్లీ ఫోటో తీయండి' : 'Retake Photo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Photo Button (Real Browser Live Camera) */}
                <button
                  type="button"
                  onClick={() => setCameraModalOpen(true)}
                  className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-gov-navy rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-gov-navy flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{t('report.takePhoto', 'Take Photo')}</div>
                    <div className="text-[10px] text-slate-500">{t('report.openCamera', 'Open live device camera')}</div>
                  </div>
                </button>

                {/* Upload Photo Button (Browse Device Storage) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-gov-navy rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-gov-navy flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{t('report.uploadPhoto', 'Upload from Device')}</div>
                    <div className="text-[10px] text-slate-500">{t('report.fromStorage', 'From phone/PC storage (JPG, PNG, WebP)')}</div>
                  </div>
                </button>
              </div>
            )}

            {/* Hidden File Picker Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageFileChange}
              className="hidden"
            />
          </div>

          {/* Real Live Camera Modal */}
          <CameraModal
            isOpen={cameraModalOpen}
            onClose={() => setCameraModalOpen(false)}
            onPhotoCaptured={handleCameraCapture}
            title={language === 'TE' ? 'కెమెరా ద్వారా ఫోటో సాక్ష్యం తీయండి' : 'Capture Grievance Photo Evidence'}
          />

          {/* Detailed Description with AI-Generate Option */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-slate-800 font-bold text-sm">{t('report.detailedDesc', 'Detailed Description *')}</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={generatingAiDesc}
                className="bg-blue-50 hover:bg-blue-100 text-gov-navy border border-blue-200 px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-gov-gold" />
                {generatingAiDesc ? t('report.analyzingImage', 'Analyzing Image...') : t('report.generateAi', 'Generate Description with AI')}
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('report.descPlaceholder', 'Describe the issue size, hazard level, and exact location markers...')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-900 text-xs sm:text-sm font-medium bg-white"
            />
          </div>

          {/* GPS Location & Reverse Geocoded Address */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-slate-800 font-bold text-sm">{t('report.location', 'Location & Address *')}</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={detectingGps}
                className="text-gov-navy font-bold text-xs flex items-center gap-1 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 disabled:opacity-50"
              >
                <MapPin className="w-3.5 h-3.5 text-gov-navy" /> {detectingGps ? t('report.detectingGps', 'Detecting GPS...') : t('report.autoGps', 'Auto Detect GPS')}
              </button>
            </div>

            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street name, locality, town/city, district (editable)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-gov-navy text-slate-900 font-medium bg-white"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder={t('report.landmarkPlaceholder', 'Nearby Landmark (optional)')}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white"
              />
              <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between text-slate-700">
                <span>
                  📍 GPS:{' '}
                  {locationDetected && lat !== null && lng !== null
                    ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                    : language === 'TE'
                    ? 'GPS గుర్తించడానికి వేచి ఉంది'
                    : 'Pending GPS detection'}
                </span>
                {locationDetected && (
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {language === 'TE' ? 'గుర్తించబడింది' : 'Detected'}
                  </span>
                )}
              </div>
            </div>

            {/* OpenStreetMap Component with interactive marker */}
            <div className="rounded-xl overflow-hidden border border-slate-300 shadow-inner">
              <GoogleMap
                lat={lat}
                lng={lng}
                address={address}
                onLocationSelect={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                  setLocationDetected(true);
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isLoggedIn}
            className="w-full bg-gov-navy hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-transform transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? t('report.submitting', 'Lodging Grievance...') : t('report.submit', 'Submit Grievance to Municipal Department')} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Right Live AI Inspection / Department Routing Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gov-navy text-white p-6 rounded-2xl shadow-xl space-y-4 border border-blue-900">
            <div className="flex items-center gap-2 text-gov-gold font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              {t('report.aiSidebarTitle', 'Department Routing')}
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/20 space-y-2">
              <div className="text-[11px] text-blue-200 font-medium">{t('report.aiDept', 'Department:')}</div>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setIsUserModifiedDept(true);
                  }}
                  className={`w-full bg-slate-900 font-extrabold text-sm px-3.5 py-2.5 rounded-xl border border-white/30 focus:outline-none focus:border-gov-gold cursor-pointer ${
                    selectedDepartment ? 'text-gov-gold' : 'text-slate-400 font-normal'
                  }`}
                >
                  <option value="" className="bg-slate-800 text-slate-400">
                    {language === 'TE' ? '-- విభాగాన్ని ఎంచుకోండి / AI విశ్లేషణ వేచి ఉంది --' : '-- Select Department / Pending AI analysis --'}
                  </option>
                  <option value="ROADS_ASPHALT" className="bg-slate-800 text-white font-medium">
                    {t('dept.roads', 'Roads & Asphalt')}
                  </option>
                  <option value="WATER_SUPPLY" className="bg-slate-800 text-white font-medium">
                    {t('dept.water', 'Water Supply')}
                  </option>
                  <option value="SANITATION_HEALTH" className="bg-slate-800 text-white font-medium">
                    {t('dept.sanitation', 'Sanitation & Health')}
                  </option>
                  <option value="STREET_LIGHTING" className="bg-slate-800 text-white font-medium">
                    {t('dept.lighting', 'Street Lighting')}
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 p-3 rounded-lg">
                <span className="text-[11px] text-blue-200 block">{t('report.priority', 'Priority Tag')}</span>
                <strong className="text-amber-400 font-extrabold text-sm">
                  {selectedDepartment && aiResult && aiResult.departmentCode !== 'UNCLASSIFIED'
                    ? aiResult.priority
                    : selectedDepartment
                    ? 'MEDIUM'
                    : 'Pending'}
                </strong>
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                <span className="text-[11px] text-blue-200 block">{t('report.targetSla', 'Target SLA')}</span>
                <strong className="text-white font-extrabold text-sm">
                  {selectedDepartment ? `${currentSla} ${t('sla.hours', 'Hours')}` : 'Pending'}
                </strong>
              </div>
            </div>

            <div className="bg-white/10 p-3 rounded-lg text-xs space-y-1">
              <span className="text-[11px] text-blue-200 block">{t('report.imageEvidence', 'Image Evidence')}</span>
              <strong className={imageBase64 ? 'text-emerald-400 font-extrabold' : 'text-slate-300 font-normal'}>
                {imageBase64 ? t('report.uploaded', 'Uploaded ✓') : t('report.notUploaded', 'Not uploaded')}
              </strong>
            </div>

            <div className="bg-white/10 p-3 rounded-lg text-xs space-y-1">
              <span className="text-[11px] text-blue-200 block">{t('report.locationSidebar', 'Location')}</span>
              <div className="text-slate-200 text-[11px] truncate">
                {address || (locationDetected && lat !== null && lng !== null ? `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : (language === 'TE' ? 'GPS గుర్తించడానికి వేచి ఉంది' : 'Pending GPS detection'))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Grievance Confirmation Modal with Confidence Scoring */}
      {duplicateModalOpen && existingDuplicate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-start gap-3 ${
              existingDuplicate.matchLevel === 'HIGH' || (existingDuplicate.duplicateScore && existingDuplicate.duplicateScore >= 75)
                ? 'bg-rose-50 border-rose-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                existingDuplicate.matchLevel === 'HIGH' || (existingDuplicate.duplicateScore && existingDuplicate.duplicateScore >= 75)
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {existingDuplicate.matchLevel === 'HIGH' || (existingDuplicate.duplicateScore && existingDuplicate.duplicateScore >= 75)
                    ? '🚨 High-Confidence Duplicate Grievance'
                    : '⚠️ Possible Duplicate Grievance'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  A similar complaint already exists near this location.
                </p>
              </div>
            </div>

            {/* Modal Body with Complaint Details */}
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-2.5 text-slate-800">
                {/* Confidence Match Score Badge */}
                {existingDuplicate.duplicateScore !== undefined && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">• Match Confidence:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      existingDuplicate.duplicateScore >= 75
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      Duplicate Match: {existingDuplicate.duplicateScore}% ({existingDuplicate.matchLevel || (existingDuplicate.duplicateScore >= 75 ? 'HIGH' : 'MEDIUM')})
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">• Existing Complaint:</span>
                  <strong className="font-mono text-gov-navy font-bold">{existingDuplicate.complaintNo}</strong>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium shrink-0">• Issue:</span>
                  <strong className="text-slate-800 text-right">{existingDuplicate.title}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">• Distance:</span>
                  <strong className="text-amber-700 font-bold">
                    {existingDuplicate.distanceMeters !== undefined && existingDuplicate.distanceMeters !== null
                      ? `${existingDuplicate.distanceMeters} m`
                      : 'Nearby'}
                  </strong>
                </div>
                {existingDuplicate.departmentName && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>Department:</span>
                    <span className="font-semibold text-slate-700">{existingDuplicate.departmentName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
              <a
                href={`/citizen/complaints/${existingDuplicate.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Existing Complaint
              </a>
              <button
                type="button"
                onClick={(e) => {
                  setDuplicateModalOpen(false);
                  handleSubmit(e, existingDuplicate.id);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gov-navy hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Anyway
              </button>
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(false)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
