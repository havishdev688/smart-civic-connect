'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, RotateCw } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (base64Image: string) => void;
  title?: string;
}

export default function CameraModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  title = 'Capture Photo Evidence',
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [loadingCamera, setLoadingCamera] = useState(false);

  // Stop active camera media tracks
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start camera stream via getUserMedia
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setErrorMsg(null);
    setCapturedImage(null);
    setLoadingCamera(true);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not supported by your browser or environment. Please use "Upload from Device" instead.');
      setLoadingCamera(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // First try with preferred facing mode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (firstErr) {
        // Fallback to basic video constraint if ideal facingMode fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((playErr) => {
            console.error('Error playing video stream', playErr);
          });
        };
      }

      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings or use "Upload from Device".');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera device was detected on your system. Please use "Upload from Device" instead.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg('Camera is currently in use by another application. Please close other camera apps and retry.');
      } else {
        setErrorMsg(`Unable to access camera: ${err.message || 'Unknown error'}. Please use "Upload from Device".`);
      }
      setCameraActive(false);
    } finally {
      setLoadingCamera(false);
    }
  };

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setErrorMsg(null);
      startCamera(facingMode);
    } else {
      stopCamera();
      setCapturedImage(null);
      setErrorMsg(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Handle capture photo from video feed
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    // Use actual video dimensions
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);

    // Stop camera stream while showing captured image preview
    stopCamera();
  };

  // Retake photo: restart camera stream
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm photo usage
  const handleUsePhoto = () => {
    if (capturedImage) {
      onPhotoCaptured(capturedImage);
      stopCamera();
      onClose();
    }
  };

  // Close and cleanup
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  // Toggle front/back camera if available
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <Camera className="w-4 h-4 text-gov-gold" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[65vh] overflow-hidden">
          {/* Live Video Stream Viewfinder */}
          {!capturedImage && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full max-h-[55vh] object-contain rounded-lg ${cameraActive ? 'block' : 'hidden'}`}
              />

              {loadingCamera && (
                <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
                  <RotateCw className="w-8 h-8 animate-spin text-gov-gold" />
                  <p className="text-xs font-semibold">Accessing live camera...</p>
                </div>
              )}

              {cameraActive && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Camera Feed
                </div>
              )}

              {/* Camera flip button if on mobile / multi-camera */}
              {cameraActive && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  title="Switch Camera"
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-slate-700 shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-2">
              <img
                src={capturedImage}
                alt="Captured Snapshot"
                className="w-full max-h-[55vh] object-contain rounded-xl border border-slate-700 shadow-lg"
              />
              <div className="absolute top-4 left-4 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Photo Captured
              </div>
            </div>
          )}

          {/* Error / Fallback State */}
          {errorMsg && !capturedImage && (
            <div className="p-6 max-w-md text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-red-300">Camera Unavailable</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{errorMsg}</p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-600 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gov-navy hover:bg-blue-800 text-xs font-bold rounded-xl text-white shadow"
                >
                  Upload from Device
                </button>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          {!capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCapture}
                disabled={!cameraActive}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Camera className="w-4 h-4" /> Capture Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
              </button>

              <button
                type="button"
                onClick={handleUsePhoto}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Check className="w-4 h-4" /> Use Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
