import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  Camera,
  Cloud,
  FileText,
  Globe,
  Image as ImageIcon,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  TrendingUp,
  UserSquare2,
  Wifi,
  Zap,
} from 'lucide-react';
import { ContentType } from '../types/qr';
import { PLAN_CATALOG, normalizeShortCodeInput } from '../utils/qrLogic';

interface PublicHomeViewProps {
  onGoogleLogin: () => Promise<void>;
  onEnterDemoWorkspace: (role: 'ADMIN' | 'SUPER_ADMIN') => void;
  onOpenScanner: () => void;
  onResolveShortCode: (shortCode: string) => void;
}

const SHOWCASE_TYPES: {
  type: ContentType;
  title: string;
  subtitle: string;
  sampleCode: string;
  ctaLabel: string;
  previewLine: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    type: 'URL',
    title: 'Link / URL',
    subtitle: 'Any website, store or page',
    sampleCode: 'QRD-WEB101',
    ctaLabel: 'Open Website',
    previewLine: 'https://yourwebsite.com',
    icon: Globe,
  },
  {
    type: 'TEXT',
    title: 'Text / Announcement',
    subtitle: 'Share text or promo coupon',
    sampleCode: 'QRD-PR0M20',
    ctaLabel: 'Copy Code (QRD20)',
    previewLine: 'Special Offer! Get 20% OFF',
    icon: FileText,
  },
  {
    type: 'IMAGE',
    title: 'Image / Menu',
    subtitle: 'Show an image or restaurant menu',
    sampleCode: 'QRD-8F3K9A',
    ctaLabel: 'View Full Menu',
    previewLine: 'Welcome to Our Restaurant!',
    icon: ImageIcon,
  },
  {
    type: 'VCARD',
    title: 'VCARD',
    subtitle: 'Share a digital business card',
    sampleCode: 'QRD-VC4RD1',
    ctaLabel: 'Save Contact',
    previewLine: 'Ahmed Mohamed · Business Manager',
    icon: UserSquare2,
  },
  {
    type: 'WIFI',
    title: 'WiFi',
    subtitle: 'Share WiFi network credentials',
    sampleCode: 'QRD-W1F199',
    ctaLabel: 'Copy Wi-Fi Info',
    previewLine: 'SSID: QRDynamic_WiFi',
    icon: Wifi,
  },
  {
    type: 'GEO_EVENT',
    title: 'Geo Event',
    subtitle: 'Open a location on Google Maps',
    sampleCode: 'QRD-M4P772',
    ctaLabel: 'Open in Maps',
    previewLine: '14 Talaat Harb St, Downtown Cairo',
    icon: MapPin,
  },
];

export const PublicHomeView: React.FC<PublicHomeViewProps> = ({
  onGoogleLogin,
  onEnterDemoWorkspace,
  onOpenScanner,
  onResolveShortCode,
}) => {
  const [shortIdSearch, setShortIdSearch] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeShortCodeInput(shortIdSearch);
    if (!code) return;
    onResolveShortCode(code);
  };

  const handleGoogleClick = async () => {
    setAuthError('');
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setAuthError(
        err?.message || 'Google Sign-In popup could not complete. You can also explore the live workspace.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#292824]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#F8F5EF]/95 backdrop-blur-xs border-b border-[#E6E0D6]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single wordmark */}
          <a
            href="#top"
            className="text-xl font-bold tracking-tight text-[#292824] whitespace-nowrap shrink-0"
          >
            QR<span className="text-[#D97745]">Dynamic</span>
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#6E6A63]">
            <a
              href="#content-types"
              className="hover:text-[#292824] transition-colors whitespace-nowrap shrink-0"
            >
              Content Types
            </a>
            <a
              href="#architecture"
              className="hover:text-[#292824] transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#lookup"
              className="hover:text-[#292824] transition-colors whitespace-nowrap shrink-0"
            >
              QR Lookup
            </a>
            <a
              href="#pricing"
              className="hover:text-[#292824] transition-colors whitespace-nowrap shrink-0"
            >
              Plans
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowSignInModal(true)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#D97745] hover:bg-[#c56737] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Split Section matching Image 2 top-left */}
      <section id="top" className="max-w-7xl mx-auto px-6 pt-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-semibold text-[#D97745] tracking-wide">
              Dynamic QR & Smart Link Management SaaS · من فكرة الطباعة الثابتة إلى التوجيه السحابي
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#292824] leading-[1.12] text-balance">
              Dynamic QR Codes for a <span className="text-[#D97745]">Smarter</span> World
            </h1>
            <p className="text-base sm:text-lg text-[#6E6A63] max-w-xl leading-relaxed">
              Create, manage, and update your QR code destinations anytime without reprinting.
              Built with atomic scan limits, 6 dynamic content engines, and multi-role access control.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onEnterDemoWorkspace('ADMIN')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-bold rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onEnterDemoWorkspace('SUPER_ADMIN')}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] text-sm font-bold rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Super Admin Console</span>
              </button>

              <button
                type="button"
                onClick={onOpenScanner}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#233229] hover:bg-[#1a261f] text-white text-sm font-bold rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-4 h-4 text-[#D97745]" />
                <span>QR Scanner</span>
              </button>
            </div>

            {/* Quick Short ID Lookup Bar inside Hero */}
            <form
              id="lookup"
              onSubmit={handleLookupSubmit}
              className="max-w-lg bg-white border border-[#E6E0D6] rounded-2xl p-2 flex items-center gap-2 shadow-2xs"
            >
              <Search className="w-4 h-4 text-[#6E6A63] ml-2.5 shrink-0" />
              <input
                type="text"
                aria-label="Lookup QR by Short ID"
                value={shortIdSearch}
                onChange={(e) => setShortIdSearch(e.target.value)}
                placeholder="Lookup Short ID (e.g. QRD-8F3K9A or QRD-VC4RD1)..."
                className="flex-1 bg-transparent text-xs font-mono text-[#292824] focus:outline-none px-2 py-1.5"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#D97745] border border-[#E6E0D6] rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Inspect QR
              </button>
            </form>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E6E0D6] rounded-3xl p-8 shadow-sm relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-semibold text-[#6E6A63] block">
                    Static Printed Code
                  </span>
                  <span className="text-lg font-mono font-bold text-[#292824]">
                    /r/QRD-8F3K9A
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#2E6B3E]">
                  Active · 2,140 Scans
                </span>
              </div>

              <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-6 flex flex-col items-center justify-center mb-6">
                <div className="bg-white p-5 rounded-2xl border-2 border-[#D97745]/30 shadow-xs">
                  <QRCodeSVG
                    value="https://qrdynamic.app/r/QRD-8F3K9A"
                    size={176}
                    fgColor="#292824"
                    bgColor="#FFFFFF"
                    level="H"
                  />
                </div>
                <p className="text-xs text-[#6E6A63] mt-3">
                  Change destination X → Y in real time without reprinting
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onResolveShortCode('QRD-8F3K9A')}
                  className="py-2.5 px-4 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Test Restaurant Menu
                </button>
                <button
                  type="button"
                  onClick={() => onResolveShortCode('QRD-VC4RD1')}
                  className="py-2.5 px-4 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Test Digital vCard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Strip below Hero matching mockup */}
        <div
          id="architecture"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#E6E0D6]"
        >
          {[
            {
              icon: Zap,
              title: 'Dynamic Links',
              desc: 'Decouple printed QR codes from live target destinations',
            },
            {
              icon: TrendingUp,
              title: 'Real-Time Stats',
              desc: 'Atomic scan registration & quota enforcement per barcode',
            },
            {
              icon: ShieldCheck,
              title: 'Secure & Reliable',
              desc: 'Role-based security rules & instant account suspension sync',
            },
            {
              icon: Cloud,
              title: 'Cloud Based',
              desc: 'Powered by Cloud Firestore & Smart Redirect Engine (/r/code)',
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white border border-[#E6E0D6] rounded-2xl p-5 flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#292824]">{feat.title}</h3>
                  <p className="text-xs text-[#6E6A63] mt-0.5 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: 6 Dynamic Content Types Showcase (Matching Image 1 "One QR ... Endless Possibilities") */}
      <section id="content-types" className="max-w-7xl mx-auto px-6 py-14 border-t border-[#E6E0D6]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold text-[#D97745] mb-1">
            01. Six Dynamic Content Engines
          </p>
          <h2 className="text-3xl font-bold text-[#292824]">
            One QR ... Endless Possibilities
          </h2>
          <p className="text-sm text-[#6E6A63] mt-2">
            Every QR code supports external redirects or interactive internal Smart Landing experiences.
            Click any card below to test its live Smart Landing page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SHOWCASE_TYPES.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.type}
                className="bg-white border border-[#E6E0D6] rounded-3xl p-6 flex flex-col justify-between hover:border-[#D97745] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#D97745] text-white flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#292824]">{card.title}</h3>
                        <p className="text-xs text-[#6E6A63]">{card.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#6E6A63]">{card.sampleCode}</span>
                  </div>

                  {/* Simulated Mobile Screen Frame inside Card */}
                  <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-4 my-3">
                    <span className="text-[11px] font-mono text-[#6E6A63] block mb-1">
                      Smart Landing Preview
                    </span>
                    <p className="text-sm font-bold text-[#292824] truncate">{card.previewLine}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onResolveShortCode(card.sampleCode)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FDF2EC] hover:bg-[#D97745] text-[#D97745] hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <span>{card.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Subscription Plans & Quotas */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-14 border-t border-[#E6E0D6]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold text-[#D97745] mb-1">
            02. Transparent Quota Architecture
          </p>
          <h2 className="text-3xl font-bold text-[#292824]">
            Subscription Plans & Limits
          </h2>
          <p className="text-sm text-[#6E6A63] mt-2">
            Manage thousands of dynamic QR codes with granular control over scan limits, direct routing, and white-label branding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(['FREE', 'PRO', 'ENTERPRISE', 'CUSTOM'] as const).map((tierKey) => {
            const tier = PLAN_CATALOG[tierKey];
            const highlighted = tierKey === 'PRO';
            return (
              <div
                key={tierKey}
                className={`rounded-3xl p-6 border flex flex-col justify-between ${
                  highlighted
                    ? 'bg-[#233229] text-white border-[#233229]'
                    : 'bg-white text-[#292824] border-[#E6E0D6]'
                }`}
              >
                <div>
                  <span
                    className={`text-xs font-bold tracking-wide ${
                      highlighted ? 'text-[#D97745]' : 'text-[#6E6A63]'
                    }`}
                  >
                    {tier.plan}
                  </span>
                  <h3 className="text-xl font-bold mt-1">{tier.label}</h3>
                  <p
                    className={`text-xs mt-1 ${
                      highlighted ? 'text-[#E6E0D6]' : 'text-[#6E6A63]'
                    }`}
                  >
                    {tier.tagline}
                  </p>

                  <div className="my-6 pt-5 border-t border-current/10 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="opacity-75">Dynamic QR Codes</span>
                      <span className="font-mono font-bold tabular-nums">
                        {tierKey === 'CUSTOM' ? 'Manual' : tier.maxBarcodes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Scans per Code</span>
                      <span className="font-mono font-bold tabular-nums">
                        {tierKey === 'CUSTOM'
                          ? 'Manual'
                          : tier.maxScansPerBarcode.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Direct Redirect</span>
                      <span className="font-bold">
                        {tier.allowDirectRedirect ? 'Included' : 'Landing Only'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Hide Branding</span>
                      <span className="font-bold">
                        {tier.allowWhiteLabel ? 'White-Label' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEnterDemoWorkspace('ADMIN')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    highlighted
                      ? 'bg-[#D97745] hover:bg-[#c56737] text-white'
                      : 'bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6]'
                  }`}
                >
                  Open {tier.label} Workspace
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E6E0D6] py-8 px-6 text-center text-xs text-[#6E6A63]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            <strong className="text-[#292824]">QR</strong>
            <strong className="text-[#D97745]">Dynamic</strong> — Dynamic QR & Smart Link Management SaaS
          </span>
          <span>Simple. Powerful. Dynamic.</span>
        </div>
      </footer>

      {/* Sign-In Card Modal matching Image 2 top-center ("Welcome Back! Continue with Google") */}
      {showSignInModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-back-title"
        >
          <div className="bg-white border border-[#E6E0D6] rounded-3xl max-w-md w-full p-8 text-center shadow-xl relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D97745] text-white flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-[#292824]">
                QR<span className="text-[#D97745]">Dynamic</span>
              </span>
            </div>

            <h2 id="welcome-back-title" className="text-2xl font-bold text-[#292824]">
              Welcome Back!
            </h2>
            <p className="text-xs text-[#6E6A63] mt-1 mb-6">
              Sign in to continue to your dashboard
            </p>

            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#F8F5EF] hover:bg-[#EFECE6] border border-[#E6E0D6] rounded-2xl text-sm font-bold text-[#292824] transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#D97745]" />
              <span>Continue with Google</span>
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-[#6E6A63]">
              <div className="flex-1 h-px bg-[#E6E0D6]" />
              <span>or instant role preview</span>
              <div className="flex-1 h-px bg-[#E6E0D6]" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowSignInModal(false);
                  onEnterDemoWorkspace('ADMIN');
                }}
                className="py-2.5 px-3 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Subscriber (Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignInModal(false);
                  onEnterDemoWorkspace('SUPER_ADMIN');
                }}
                className="py-2.5 px-3 bg-[#233229] hover:bg-[#1a261f] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Super Admin
              </button>
            </div>

            {authError && (
              <p className="mt-4 text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowSignInModal(false)}
              className="mt-6 text-xs font-semibold text-[#6E6A63] hover:text-[#292824] cursor-pointer"
            >
              Cancel and return to homepage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
