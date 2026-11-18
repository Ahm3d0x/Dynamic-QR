import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Search, Upload, X, QrCode, ArrowRight } from 'lucide-react';
import { normalizeShortCodeInput } from '../utils/qrLogic';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolveCode: (shortCode: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onResolveCode,
}) => {
  const [mode, setMode] = useState<'CAMERA' | 'UPLOAD' | 'MANUAL'>('UPLOAD');
  const [manualInput, setManualInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStatusMsg('');
      setManualInput('');
    }
    return () => stopCamera();
  }, [isOpen]);

  const stopCamera = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setStatusMsg('Requesting camera permission...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setStatusMsg('Point your camera at a QRDynamic code...');
        tickScan();
      }
    } catch {
      setStatusMsg('Camera unavailable in this browser frame. Use Image Upload or Short ID lookup.');
      setCameraActive(false);
    }
  };

  const tickScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          const resolved = normalizeShortCodeInput(code.data);
          if (resolved) {
            stopCamera();
            onClose();
            onResolveCode(resolved);
            return;
          }
        }
      }
    }
    animRef.current = requestAnimationFrame(tickScan);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg('Scanning uploaded image...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);
        if (decoded && decoded.data) {
          const normalized = normalizeShortCodeInput(decoded.data);
          setStatusMsg(`Detected code: ${normalized}`);
          onClose();
          onResolveCode(normalized);
        } else {
          setStatusMsg('No valid QR code found in the selected image. Try another image or enter Short ID.');
        }
      };
      img.src = String(event.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeShortCodeInput(manualInput);
    if (!code) {
      setStatusMsg('Please enter a valid Short ID (e.g. QRD-8F3K9A).');
      return;
    }
    onClose();
    onResolveCode(code);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      <div className="bg-white border border-[#E6E0D6] rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="text-lg font-bold text-[#292824]">
                QR Scanner & Lookup
              </h2>
              <p className="text-xs text-[#6E6A63]">
                Scan with camera, upload a QR image, or enter Short ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR Scanner"
            className="p-2 rounded-lg text-[#6E6A63] hover:text-[#292824] hover:bg-[#F8F5EF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl my-4">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('CAMERA');
              startCamera();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'CAMERA'
                ? 'bg-white text-[#292824] shadow-2xs'
                : 'text-[#6E6A63] hover:text-[#292824]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('UPLOAD');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'UPLOAD'
                ? 'bg-white text-[#292824] shadow-2xs'
                : 'text-[#6E6A63] hover:text-[#292824]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('MANUAL');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'MANUAL'
                ? 'bg-white text-[#292824] shadow-2xs'
                : 'text-[#6E6A63] hover:text-[#292824]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Short ID</span>
          </button>
        </div>

        {mode === 'CAMERA' && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-[#233229] aspect-4/3 flex items-center justify-center border border-[#E6E0D6]">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Scanner viewfinder corners */}
              <div className="absolute inset-8 border-2 border-white/60 rounded-2xl pointer-events-none" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-[#233229]/90">
                  <Camera className="w-8 h-8 text-[#D97745] mb-2" />
                  <p className="text-xs text-[#E6E0D6] mb-3">
                    Point your camera at a QR code to trigger instant redirection
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-[#D97745] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Start Camera
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'UPLOAD' && (
          <div className="space-y-4">
            <label
              htmlFor="qr-image-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-[#D97745]/40 hover:border-[#D97745] bg-[#F8F5EF] rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-[#D97745] mb-2" />
              <span className="text-sm font-semibold text-[#292824]">
                Upload a QR Code PNG / JPG
              </span>
              <span className="text-xs text-[#6E6A63] mt-1">
                Decodes the QR payload directly in your browser
              </span>
              <input
                id="qr-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {mode === 'MANUAL' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="manual-shortcode-input"
                className="block text-xs font-semibold text-[#292824] mb-1.5"
              >
                Enter Short ID
              </label>
              <input
                id="manual-shortcode-input"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. QRD-8F3K9A or QRD-VC4RD1"
                className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono text-[#292824] focus:outline-none focus:border-[#D97745]"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Open Smart Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {statusMsg && (
          <p className="mt-3 text-xs text-[#6E6A63] bg-[#F8F5EF] px-3 py-2 rounded-lg border border-[#E6E0D6]">
            {statusMsg}
          </p>
        )}

        {/* Quick Demo Short Codes to Test */}
        <div className="mt-5 pt-4 border-t border-[#EFECE6]">
          <span className="text-[11px] font-semibold text-[#6E6A63] block mb-2">
            Quick Test Live Short Codes:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['QRD-8F3K9A', 'QRD-VC4RD1', 'QRD-W1F199', 'QRD-PR0M20', 'QRD-M4P772'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  onClose();
                  onResolveCode(code);
                }}
                className="px-2.5 py-1 bg-[#F8F5EF] hover:bg-[#FDF2EC] hover:text-[#D97745] border border-[#E6E0D6] rounded-lg text-xs font-mono font-semibold text-[#292824] transition-colors cursor-pointer"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
