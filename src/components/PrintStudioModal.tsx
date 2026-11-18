import React, { useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, ExternalLink, Printer, X } from 'lucide-react';
import { BarcodeRecord } from '../types/qr';
import { buildShortLinkUrl } from '../utils/qrLogic';

interface PrintStudioModalProps {
  barcode: BarcodeRecord | null;
  onClose: () => void;
  onTestLanding: (shortCode: string) => void;
}

export const PrintStudioModal: React.FC<PrintStudioModalProps> = ({
  barcode,
  onClose,
  onTestLanding,
}) => {
  const [copied, setCopied] = React.useState(false);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  if (!barcode) return null;

  const shortUrl = buildShortLinkUrl(barcode.shortCode);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${barcode.shortCode}-${barcode.title.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadSVG = () => {
    const svgEl = svgWrapRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${barcode.shortCode}-${barcode.title.replace(/\s+/g, '_')}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-studio-title"
    >
      <div className="bg-white border border-[#E6E0D6] rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 id="print-studio-title" className="text-lg font-bold text-[#292824]">
                QR Print Studio
              </h2>
              <p className="text-xs text-[#6E6A63]">
                {barcode.title} · <span className="font-mono">{barcode.shortCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR Print Studio"
            className="p-2 rounded-lg text-[#6E6A63] hover:text-[#292824] hover:bg-[#F8F5EF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 items-center">
          {/* QR Code Preview Frame */}
          <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-6 flex flex-col items-center justify-center">
            <div
              ref={svgWrapRef}
              className="bg-white p-4 rounded-xl border border-[#E6E0D6] shadow-2xs"
            >
              <QRCodeSVG
                value={shortUrl}
                size={168}
                fgColor={barcode.qrColor || '#292824'}
                bgColor="#FFFFFF"
                level="H"
                includeMargin={false}
              />
            </div>
            {/* Hidden high-res canvas for crisp PNG export */}
            <div ref={canvasWrapRef} className="hidden" aria-hidden="true">
              <QRCodeCanvas
                value={shortUrl}
                size={1024}
                fgColor={barcode.qrColor || '#292824'}
                bgColor="#FFFFFF"
                level="H"
                includeMargin={true}
              />
            </div>

            {!barcode.hideBranding && (
              <span className="mt-3 text-[11px] font-semibold text-[#6E6A63] tracking-tight">
                Powered by <span className="text-[#D97745]">QRDynamic</span>
              </span>
            )}
          </div>

          {/* Export Actions */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-[#6E6A63]">
              Print once, change destination anytime
            </p>

            <button
              type="button"
              onClick={handleDownloadPNG}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>PNG (High Quality)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSVG}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#233229] hover:bg-[#1a261f] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>SVG (Vector Print)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#2E6B3E]" />
                  <span>Short Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Short Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTestLanding(barcode.shortCode);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#D97745] hover:underline cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Simulate Scan (/r/{barcode.shortCode})</span>
            </button>
          </div>
        </div>

        <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="truncate">
            <span className="text-[11px] text-[#6E6A63] block">Permanent Dynamic Routing URL</span>
            <span className="text-xs font-mono font-semibold text-[#292824] truncate block">
              {shortUrl}
            </span>
          </div>
          <span className="text-xs font-mono text-[#6E6A63] shrink-0 tabular-nums">
            {barcode.scanCount.toLocaleString()} / {barcode.maxScansLimit.toLocaleString()} scans
          </span>
        </div>
      </div>
    </div>
  );
};
