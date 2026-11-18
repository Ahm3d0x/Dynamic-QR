import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Globe,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  QrCode,
  ShieldAlert,
  Utensils,
  Wifi,
} from 'lucide-react';
import { BarcodeRecord } from '../types/qr';
import {
  buildGoogleMapsUrl,
  evaluateSmartRedirect,
  formatVCardDownloadString,
  parseGeoEvent,
  parseTextPromo,
  parseVCard,
  parseWifi,
} from '../utils/qrLogic';

interface SmartRedirectViewProps {
  shortCode: string;
  barcode: BarcodeRecord | null | undefined;
  onRegisterAtomicScan: (shortCode: string) => Promise<void>;
  onExitToHome: () => void;
}

export const SmartRedirectView: React.FC<SmartRedirectViewProps> = ({
  shortCode,
  barcode,
  onRegisterAtomicScan,
  onExitToHome,
}) => {
  const [scanRegistered, setScanRegistered] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [imageOpened, setImageOpened] = useState(false);
  const [directCountdown, setDirectCountdown] = useState<number | null>(null);

  const validation = evaluateSmartRedirect(barcode);

  useEffect(() => {
    setScanRegistered(false);
    setCopiedToken(false);
    setImageOpened(false);
    setDirectCountdown(null);
  }, [shortCode]);

  useEffect(() => {
    if (validation.status === 'OK' && !scanRegistered) {
      setScanRegistered(true);
      onRegisterAtomicScan(validation.barcode.shortCode);

      if (validation.mode === 'DIRECT') {
        setDirectCountdown(2);
      }
    }
  }, [validation.status, scanRegistered]);

  useEffect(() => {
    if (directCountdown === null || directCountdown <= 0) return;
    const timer = setTimeout(() => {
      setDirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 900);
    return () => clearTimeout(timer);
  }, [directCountdown]);

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard failure in headless browsers
    }
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleDownloadVCard = (destination: string) => {
    const vcard = parseVCard(destination);
    const vcfContent = formatVCardDownloadString(vcard);
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${vcard.fullName.replace(/\s+/g, '_')}.vcf`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Error states rendering
  if (validation.status !== 'OK') {
    const errorMeta: Record<
      string,
      { title: string; badge: string; icon: React.FC<{ className?: string }> }
    > = {
      CODE_NOT_FOUND: {
        title: 'QR Code Not Found',
        badge: 'Error 404 · Code Not Found',
        icon: AlertOctagon,
      },
      ACCOUNT_SUSPENDED: {
        title: 'Owner Account Suspended',
        badge: 'Security · Account Suspended',
        icon: ShieldAlert,
      },
      QR_CODE_DISABLED: {
        title: 'QR Code Paused',
        badge: 'Status · QR Code Disabled',
        icon: PauseCircle,
      },
      SCAN_LIMIT_REACHED: {
        title: 'Scan Quota Reached',
        badge: 'Quota · Scan Limit Reached',
        icon: AlertOctagon,
      },
      INVALID_DESTINATION: {
        title: 'Invalid Destination Data',
        badge: 'Configuration · Invalid Destination',
        icon: AlertOctagon,
      },
    };

    const meta = errorMeta[validation.status] || errorMeta.CODE_NOT_FOUND;
    const Icon = meta.icon;

    return (
      <div className="min-h-screen bg-[#F8F5EF] text-[#292824] flex flex-col justify-between p-6">
        <header className="max-w-4xl w-full mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onExitToHome}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#292824] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#D97745] text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <span>
              QR<span className="text-[#D97745]">Dynamic</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onExitToHome}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-semibold text-[#292824] hover:bg-[#EFECE6] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Platform</span>
          </button>
        </header>

        <main className="max-w-md w-full mx-auto my-12 bg-white border border-[#E6E0D6] rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mx-auto mb-4">
            <Icon className="w-7 h-7" />
          </div>
          <p className="text-xs font-mono text-[#6E6A63] mb-1">
            {meta.badge} · {shortCode}
          </p>
          <h1 className="text-xl font-bold text-[#292824] mb-2">{meta.title}</h1>
          <p className="text-sm text-[#6E6A63] mb-6">{validation.message}</p>
          <button
            type="button"
            onClick={onExitToHome}
            className="w-full py-2.5 px-4 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Return to QRDynamic Home
          </button>
        </main>

        <footer className="text-center text-xs text-[#6E6A63]">
          Smart Redirect Engine · Routing ID <span className="font-mono">{shortCode}</span>
        </footer>
      </div>
    );
  }

  const activeBarcode = validation.barcode;

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#292824] flex flex-col justify-between">
      {/* Top Smart Landing Bar */}
      <header className="w-full bg-white/90 backdrop-blur-xs border-b border-[#E6E0D6] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onExitToHome}
            className="inline-flex items-center gap-2 text-base font-bold text-[#292824] cursor-pointer whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-lg bg-[#D97745] text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <span>
              QR<span className="text-[#D97745]">Dynamic</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#6E6A63] hidden sm:inline">
              /r/{activeBarcode.shortCode} · Scan #{activeBarcode.scanCount.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={onExitToHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F8F5EF] hover:bg-[#EFECE6] border border-[#E6E0D6] rounded-xl text-xs font-semibold text-[#292824] transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-[#E6E0D6] rounded-3xl p-8 shadow-sm text-center relative overflow-hidden">
          {/* DIRECT REDIRECT MODE */}
          {validation.mode === 'DIRECT' && (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mx-auto">
                <Globe className="w-7 h-7" />
              </div>
              <p className="text-xs font-mono text-[#2E6B3E]">
                Direct Redirect Mode · Atomic Scan Verified
              </p>
              <h1 className="text-2xl font-bold text-[#292824]">{activeBarcode.title}</h1>
              <p className="text-sm text-[#6E6A63]">
                {directCountdown && directCountdown > 0
                  ? `Redirecting you automatically in ${directCountdown}s...`
                  : 'Destination verified and ready to open:'}
              </p>
              <div className="p-3 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs font-mono text-[#292824] truncate">
                {activeBarcode.destination}
              </div>
              <a
                href={activeBarcode.destination}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-2xl transition-colors"
              >
                <span>{activeBarcode.ctaText || 'Open Destination'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* LANDING MODE — URL */}
          {validation.mode === 'LANDING' && activeBarcode.type === 'URL' && (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[#D97745] text-white flex items-center justify-center mx-auto shadow-xs">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#292824]">{activeBarcode.title}</h1>
                <p className="text-sm text-[#6E6A63] mt-1.5">{activeBarcode.welcomeMessage}</p>
              </div>
              <div className="px-4 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs font-mono text-[#6E6A63] truncate">
                {activeBarcode.destination}
              </div>
              <a
                href={activeBarcode.destination}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-2xl transition-colors"
              >
                <span>{activeBarcode.ctaText || 'Open Website'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* LANDING MODE — IMAGE / MENU (Matching "Welcome to Our Restaurant!" mockup) */}
          {validation.mode === 'LANDING' && activeBarcode.type === 'IMAGE' && (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[#D97745] text-white flex items-center justify-center mx-auto shadow-xs">
                <Utensils className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#292824]">
                  {activeBarcode.title || 'Welcome to Our Restaurant!'}
                </h1>
                <p className="text-sm text-[#6E6A63] mt-1">
                  {activeBarcode.welcomeMessage || 'Discover our delicious menu'}
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[#E6E0D6] bg-[#F8F5EF]">
                <img
                  src={activeBarcode.destination}
                  alt={activeBarcode.title}
                  referrerPolicy="no-referrer"
                  className={`w-full object-cover transition-all ${
                    imageOpened ? 'max-h-[520px]' : 'max-h-56'
                  }`}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setImageOpened(!imageOpened)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-2xl transition-colors cursor-pointer"
                >
                  <span>
                    {imageOpened ? 'Collapse Preview' : activeBarcode.ctaText || 'View Menu'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={activeBarcode.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-3.5 px-4 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] text-xs font-semibold rounded-2xl transition-colors"
                >
                  <span>Full Image</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* LANDING MODE — TEXT / ANNOUNCEMENT (Matching "Special Offer! Get 20% OFF" mockup) */}
          {validation.mode === 'LANDING' && activeBarcode.type === 'TEXT' && (
            <div className="space-y-5">
              {(() => {
                const promo = parseTextPromo(activeBarcode.destination);
                return (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mx-auto">
                      <Gift className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#D97745] block mb-1">
                        {activeBarcode.title}
                      </span>
                      <h1 className="text-2xl font-bold text-[#292824]">{promo.headline}</h1>
                      <p className="text-sm text-[#6E6A63] mt-2">{promo.body}</p>
                    </div>

                    {promo.promoCode && (
                      <div className="p-3.5 bg-[#F8F5EF] border-2 border-dashed border-[#D97745]/50 rounded-2xl flex items-center justify-between">
                        <span className="text-xs text-[#6E6A63]">Promo Code</span>
                        <span className="text-base font-mono font-bold text-[#292824] tracking-wider">
                          {promo.promoCode}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyText(promo.promoCode || promo.body)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-2xl transition-colors cursor-pointer"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{activeBarcode.ctaText || 'Copy Code'}</span>
                        </>
                      )}
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* LANDING MODE — VCARD (Matching "Ahmed Mohamed · Business Manager" mockup) */}
          {validation.mode === 'LANDING' && activeBarcode.type === 'VCARD' && (
            <div className="space-y-5 text-left">
              {(() => {
                const vc = parseVCard(activeBarcode.destination);
                return (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#233229] text-white flex items-center justify-center text-xl font-bold shrink-0">
                        {vc.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-[#292824]">{vc.fullName}</h1>
                        <p className="text-xs font-semibold text-[#D97745]">
                          {vc.jobTitle}
                          {vc.company ? ` · ${vc.company}` : ''}
                        </p>
                        <p className="text-xs text-[#6E6A63] mt-0.5">
                          {activeBarcode.welcomeMessage}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-4 space-y-2.5 text-xs">
                      {vc.phone && (
                        <div className="flex items-center gap-2.5 text-[#292824]">
                          <Phone className="w-4 h-4 text-[#D97745]" />
                          <span className="font-mono">{vc.phone}</span>
                        </div>
                      )}
                      {vc.email && (
                        <div className="flex items-center gap-2.5 text-[#292824]">
                          <Mail className="w-4 h-4 text-[#D97745]" />
                          <span>{vc.email}</span>
                        </div>
                      )}
                      {vc.website && (
                        <div className="flex items-center gap-2.5 text-[#292824]">
                          <Globe className="w-4 h-4 text-[#D97745]" />
                          <span>{vc.website}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadVCard(activeBarcode.destination)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-2xl transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{activeBarcode.ctaText || 'Save Contact (.VCF)'}</span>
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* LANDING MODE — WIFI (Matching "QRDynamic_WiFi" mockup) */}
          {validation.mode === 'LANDING' && activeBarcode.type === 'WIFI' && (
            <div className="space-y-5">
              {(() => {
                const wf = parseWifi(activeBarcode.destination);
                return (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mx-auto">
                      <Wifi className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-[#292824]">{activeBarcode.title}</h1>
                      <p className="text-xs text-[#6E6A63] mt-1">{activeBarcode.welcomeMessage}</p>
                    </div>

                    <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-4 space-y-3">
                      <div>
                        <span className="text-[11px] text-[#6E6A63] block">Network Name (SSID)</span>
                        <span className="text-base font-bold text-[#292824]">{wf.ssid}</span>
                      </div>
                      <div className="pt-2 border-t border-[#E6E0D6]">
                        <span className="text-[11px] text-[#6E6A63] block">
                          Password ({wf.encryption})
                        </span>
                        <span className="text-base font-mono font-bold text-[#D97745]">
                          {wf.password || 'No Password Required'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(wf.password || wf.ssid)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-2xl transition-colors cursor-pointer"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Wi-Fi Password Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{activeBarcode.ctaText || 'Copy Info'}</span>
                        </>
                      )}
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* LANDING MODE — GEO_EVENT (Matching "Open in Maps" mockup) */}
          {validation.mode === 'LANDING' && activeBarcode.type === 'GEO_EVENT' && (
            <div className="space-y-5">
              {(() => {
                const geo = parseGeoEvent(activeBarcode.destination);
                const mapsUrl = buildGoogleMapsUrl(geo);
                return (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mx-auto">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-[#292824]">{geo.placeName}</h1>
                      <p className="text-xs text-[#6E6A63] mt-1">{activeBarcode.welcomeMessage}</p>
                    </div>

                    <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-4 text-xs space-y-1">
                      <span className="font-semibold text-[#292824] block">
                        {geo.address || 'Pinned Coordinates'}
                      </span>
                      <span className="font-mono text-[#6E6A63] block">
                        Lat {geo.latitude} · Lng {geo.longitude}
                      </span>
                    </div>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-semibold rounded-2xl transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{activeBarcode.ctaText || 'Open in Maps'}</span>
                    </a>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* Footer (Respects White-Label setting) */}
      <footer className="py-5 text-center text-xs text-[#6E6A63]">
        {!activeBarcode.hideBranding ? (
          <span>
            Powered by <strong className="text-[#292824]">QR</strong>
            <strong className="text-[#D97745]">Dynamic</strong>
          </span>
        ) : (
          <span className="font-mono text-[11px] opacity-60">{activeBarcode.shortCode}</span>
        )}
      </footer>
    </div>
  );
};
