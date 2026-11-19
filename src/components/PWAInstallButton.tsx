import React, { useState } from 'react';
import { Download, MoreVertical, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'hero' | 'sidebar' | 'compact' | 'card';
  showFallbackGuide?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  showFallbackGuide = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Automatically suppress when running inside installed standalone PWA
  if (isInstalled) {
    return null;
  }

  // Hide unless install prompt is ready, device is iOS, or caller wants a cross-platform install trigger
  if (!isInstallable && !isIOS && !showFallbackGuide) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  const buttonLabel = isInstallable
    ? 'Install App'
    : isIOS
    ? 'Install on iPhone'
    : 'Install App';

  return (
    <>
      {variant === 'hero' && (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 min-h-[48px] bg-white hover:bg-[#FDF2EC] text-[#292824] hover:text-[#D97745] border border-[#E6E0D6] text-xs sm:text-sm font-bold rounded-2xl transition-colors cursor-pointer whitespace-nowrap ${className}`}
        >
          <Download className="w-4 h-4 text-[#D97745] shrink-0" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-[#D97745]" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install Dynamic QR App"
          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 bg-[#FDF2EC] hover:bg-[#D97745] text-[#D97745] hover:text-white border border-[#D97745]/30 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{buttonLabel}</span>
        </button>
      )}

      {variant === 'card' && (
        <div className="bg-white border border-[#E6E0D6] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/icon.svg"
              alt="Dynamic QR App Icon"
              className="w-12 h-12 rounded-2xl shrink-0"
            />
            <div>
              <h3 className="text-sm font-bold text-[#292824]">Install Dynamic QR on Your Phone</h3>
              <p className="text-xs text-[#6E6A63] mt-0.5">
                Launch full-screen from your home screen with fast QR scanning and offline shell caching.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>{buttonLabel}</span>
          </button>
        </div>
      )}

      {/* Install Instructions Sheet (iOS Safari + Android/Desktop fallback) */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#292824]/60 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white border border-[#E6E0D6] rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1.5 bg-[#E6E0D6] rounded-full mx-auto sm:hidden -mt-1" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/icon.svg"
                  alt="Dynamic QR"
                  className="w-12 h-12 rounded-2xl shrink-0 shadow-xs"
                />
                <div>
                  <h3 className="text-base font-bold text-[#292824]">Install Dynamic QR</h3>
                  <p className="text-xs text-[#6E6A63]">
                    Add to your home screen for a native app experience
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install guide"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#6E6A63] hover:bg-[#F8F5EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-sm text-[#292824]">
                <li className="flex items-start gap-3 p-3 bg-[#F8F5EF] rounded-2xl">
                  <span className="w-7 h-7 rounded-lg bg-[#D97745] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs leading-relaxed">
                    Tap the <strong className="inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-[#D97745]" /> Share</strong> button in Safari&apos;s bottom toolbar.
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 bg-[#F8F5EF] rounded-2xl">
                  <span className="w-7 h-7 rounded-lg bg-[#D97745] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs leading-relaxed">
                    Scroll down and tap <strong className="inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-[#D97745]" /> Add to Home Screen</strong>.
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 bg-[#F8F5EF] rounded-2xl">
                  <span className="w-7 h-7 rounded-lg bg-[#233229] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="text-xs leading-relaxed">
                    Tap <strong>Add</strong> in the top-right corner — <strong>Dynamic QR</strong> will appear on your home screen with its official icon.
                  </div>
                </li>
              </ol>
            ) : (
              <div className="space-y-3 text-xs text-[#292824]">
                <div className="p-3.5 bg-[#F8F5EF] rounded-2xl space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <MoreVertical className="w-3.5 h-3.5 text-[#D97745]" />
                    <span>Android (Chrome / Edge / Samsung Internet)</span>
                  </div>
                  <p className="text-[#6E6A63] leading-relaxed">
                    Open the browser menu (<strong>⋮</strong>) and tap <strong>Install app</strong> or{' '}
                    <strong>Add to Home screen</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8F5EF] rounded-2xl space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Share className="w-3.5 h-3.5 text-[#D97745]" />
                    <span>iPhone &amp; iPad (Safari)</span>
                  </div>
                  <p className="text-[#6E6A63] leading-relaxed">
                    Tap the <strong>Share</strong> icon in Safari, then choose{' '}
                    <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full min-h-[44px] py-3 bg-[#233229] hover:bg-[#1a261f] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
