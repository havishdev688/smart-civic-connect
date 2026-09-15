'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Upload,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Camera,
  Trash2,
  RefreshCw,
  ImageIcon,
  Check
} from 'lucide-react';
import Timeline from '@/components/timeline';
import CameraModal from '@/components/camera-modal';
import { getStatusBadge, getPriorityBadge } from '@/components/complaint-card';
import { Complaint, Status } from '@/types';

export default function OfficerComplaintDetail({ params }: { params: { id: string } }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<Status>('IN_PROGRESS');
  const [remarks, setRemarks] = useState('');
  const [resPhoto, setResPhoto] = useState<string | null>(null);
  const [resPhotoPreview, setResPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [lastSubmittedStatus, setLastSubmittedStatus] = useState<Status | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchComplaint = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${params.id}`);
      if (res.ok) {
        const data: Complaint = await res.json();
        setComplaint(data);
        setNewStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch complaint', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [params.id]);

  // Handle local file selection from device
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 10MB.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setResPhotoPreview(base64);
      setResPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  // Handle camera photo capture from CameraModal
  const handleCameraCapture = (base64Image: string) => {
    setResPhotoPreview(base64Image);
    setResPhoto(base64Image);
    setErrorMessage('');
  };

  // Remove selected resolution photo
  const handleRemovePhoto = () => {
    setResPhoto(null);
    setResPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit status update with photo
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || updating || (complaint.status === newStatus && !resPhoto)) return;
    
    // Prevent double submission if already at this status
    if (complaint.status === 'RESOLVED' && newStatus === 'RESOLVED') {
      return;
    }

    setUpdating(true);
    setErrorMessage('');

    try {
      let finalResolutionImageUrl = resPhoto;

      // If photo is base64, upload via storage API
      if (newStatus === 'RESOLVED' && resPhoto && resPhoto.startsWith('data:image')) {
        setUploadingPhoto(true);
        try {
          const uploadRes = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: resPhoto }),
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              finalResolutionImageUrl = uploadData.url;
            }
          }
        } catch (uploadErr) {
          console.error('Image upload failed, falling back to data URL', uploadErr);
        } finally {
          setUploadingPhoto(false);
        }
      }

      const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks || `Status updated to ${newStatus} by Field Officer`,
          resolutionImage: newStatus === 'RESOLVED' && finalResolutionImageUrl ? finalResolutionImageUrl : undefined,
        }),
      });

      if (res.ok) {
        await fetchComplaint();
        setLastSubmittedStatus(newStatus);
        setUpdateSuccess(true);
        setResPhoto(null);
        setResPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.message || 'Failed to update status on server.');
      }
    } catch (err: any) {
      console.error('Error updating status', err);
      setErrorMessage(err.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-bold text-slate-500">Loading complaint...</div>;

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Complaint Not Found</h2>
        <p className="text-slate-600 text-sm">The requested grievance is not found or has been reassigned.</p>
        <Link href="/officer/complaints" className="inline-block bg-gov-navy text-white px-4 py-2 rounded-lg font-bold text-xs">
          Return to Queue
        </Link>
      </div>
    );
  }

  const isComplaintResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';
  const isFormCompleted = updateSuccess && lastSubmittedStatus === newStatus;
  const isButtonDisabled = updating || isFormCompleted || (isComplaintResolved && newStatus === 'RESOLVED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Real Live Camera Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onPhotoCaptured={handleCameraCapture}
        title="Capture Work Resolution Proof Photo"
      />

      <div>
        <Link href="/officer/complaints" className="text-gov-navy font-bold text-xs flex items-center gap-1 hover:underline mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Officer Queue
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded border border-amber-300">{complaint.complaintNo}</span>
              {getStatusBadge(complaint.status)}
              {getPriorityBadge(complaint.priority)}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{complaint.title}</h1>
          </div>
          <div className="text-xs text-slate-500">
            Assigned Target SLA: <strong>{complaint.estimatedHours} Hours</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Officer Action Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gov-navy" /> Officer Action &amp; Status Transition
            </h3>

            {/* Success Acknowledgement Banner */}
            {updateSuccess && (
              <div className={`p-4 rounded-xl font-bold flex flex-col gap-1 border animate-in fade-in ${
                lastSubmittedStatus === 'RESOLVED'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : 'bg-blue-50 border-blue-400 text-blue-950'
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${
                    lastSubmittedStatus === 'RESOLVED' ? 'text-emerald-600' : 'text-blue-600'
                  }`} />
                  {lastSubmittedStatus === 'RESOLVED' ? '✓ Grievance Resolved' : '✓ Status Update Completed'}
                </div>
                <p className={`text-xs font-medium pl-7 ${
                  lastSubmittedStatus === 'RESOLVED' ? 'text-emerald-800' : 'text-blue-800'
                }`}>
                  {lastSubmittedStatus === 'RESOLVED'
                    ? 'Work completed and verification evidence submitted successfully.'
                    : `The grievance status has been successfully updated to ${lastSubmittedStatus}.`}
                </p>
              </div>
            )}

            {/* Terminal Resolved Notice if already RESOLVED */}
            {isComplaintResolved && !updateSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl flex flex-col gap-1 text-emerald-950">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ✓ Grievance Resolved
                </div>
                <p className="text-xs text-emerald-800 font-medium pl-7">
                  Work Completed &amp; Verified. This grievance has reached the final completed stage.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs flex items-start gap-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label className="block font-bold text-slate-800 mb-2">Select Next Status State:</label>
                <select
                  value={newStatus}
                  disabled={updating || isComplaintResolved}
                  onChange={(e) => {
                    setNewStatus(e.target.value as Status);
                    setUpdateSuccess(false);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:border-gov-navy bg-white disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="ASSIGNED">ASSIGNED (Received by Department)</option>
                  <option value="ACCEPTED">ACCEPTED (Inspected by Field Engineer)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Repair Crew Dispatched)</option>
                  <option value="RESOLVED">RESOLVED (Work Completed & Verified)</option>
                </select>
              </div>

              {!isComplaintResolved && (
                <>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Field Completion Remarks *</label>
                    <textarea
                      rows={3}
                      required
                      disabled={updating}
                      value={remarks}
                      onChange={(e) => {
                        setRemarks(e.target.value);
                        setUpdateSuccess(false);
                      }}
                      placeholder="Enter work details, materials used, crew members assigned..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>

                  {/* Work Resolution Proof Photo Section (Active when status is RESOLVED) */}
                  {newStatus === 'RESOLVED' && (
                    <div className="space-y-3 bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="block font-bold text-emerald-950 text-sm">Upload Work Resolution Proof Photo</label>
                          <p className="text-[11px] text-emerald-800">Attach field photo evidence showing completed repair or resolution.</p>
                        </div>
                        {resPhotoPreview && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-red-200 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      {resPhotoPreview ? (
                        <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-400 w-full max-w-sm h-48 bg-slate-950 shadow-md">
                          <img src={resPhotoPreview} alt="Work Resolution Proof Preview" className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-emerald-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ready to Submit
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow flex items-center gap-1 hover:bg-slate-100"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Replace File
                            </button>
                            <button
                              type="button"
                              onClick={() => setCameraModalOpen(true)}
                              className="bg-gov-navy text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow flex items-center gap-1 hover:bg-blue-800"
                            >
                              <Camera className="w-3.5 h-3.5" /> Retake
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* 1. Browse / Upload from Device */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 bg-white hover:bg-emerald-50/80 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">Browse / Upload from Device</div>
                              <div className="text-[10px] text-slate-500">JPG, PNG, WebP up to 10MB</div>
                            </div>
                          </button>

                          {/* 2. Take Photo / Real Live Camera */}
                          <button
                            type="button"
                            onClick={() => setCameraModalOpen(true)}
                            className="p-4 bg-white hover:bg-emerald-50/80 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition-all group shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Camera className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">Take Photo / Camera</div>
                              <div className="text-[10px] text-slate-500">Open live device camera</div>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Hidden File Picker */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className={`w-full font-extrabold py-3.5 rounded-xl shadow text-sm transition-all flex items-center justify-center gap-2 ${
                      isFormCompleted
                        ? 'bg-emerald-700 text-white cursor-default'
                        : updating
                        ? 'bg-slate-400 text-white cursor-wait'
                        : 'bg-gov-navy hover:bg-blue-800 text-white'
                    }`}
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Update...
                      </>
                    ) : isFormCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> ✓ Update Completed
                      </>
                    ) : (
                      'Submit Status Update'
                    )}
                  </button>
                </>
              )}

              {isComplaintResolved && (
                <button
                  type="button"
                  disabled
                  className="w-full bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-default shadow"
                >
                  <CheckCircle2 className="w-4 h-4" /> ✓ Grievance Resolved
                </button>
              )}
            </form>
          </div>

          {/* Issue Summary & Evidence Photos */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Citizen Grievance &amp; Verification Evidence</h4>
            <p className="text-slate-700 leading-relaxed">{complaint.description}</p>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-gov-navy" />
              <span>{complaint.address}</span>
            </div>

            {/* Evidence Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
              {/* Citizen Before Photo */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Citizen Evidence Photo (Before):</span>
                {complaint.images && complaint.images.length > 0 ? (
                  <img
                    src={complaint.images[0]}
                    alt="Citizen Evidence"
                    className="w-full h-36 rounded-xl object-cover border border-slate-300 shadow-sm"
                  />
                ) : (
                  <div className="h-36 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    No initial photo uploaded
                  </div>
                )}
              </div>

              {/* Officer Work Resolution Proof Photo */}
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Work Resolution Proof Photo:
                </span>
                {complaint.resolutionImages && complaint.resolutionImages.length > 0 ? (
                  <img
                    src={complaint.resolutionImages[0]}
                    alt="Work Resolution Proof"
                    className="w-full h-36 rounded-xl object-cover border-2 border-emerald-400 shadow-sm"
                  />
                ) : resPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400 shadow-sm">
                    <img
                      src={resPhotoPreview}
                      alt="Work Resolution Proof Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-emerald-700/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Selected Preview
                    </div>
                  </div>
                ) : (
                  <div className="h-36 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 p-2 text-center">
                    Resolution proof will appear once status is marked RESOLVED.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Status Audit Trail</h3>
            <Timeline currentStatus={complaint.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
