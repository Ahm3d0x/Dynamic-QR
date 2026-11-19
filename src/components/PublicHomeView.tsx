import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  Camera,
  ChevronRight,
  Cloud,
  FileText,
  Globe,
  Image as ImageIcon,
  MapPin,
  Menu,
  QrCode,
  Search,
  ShieldCheck,
  TrendingUp,
  UserSquare2,
  Wifi,
  Zap,
} from 'lucide-react';
import { ContentType, PlanType, SubscriptionPlanConfig } from '../types/qr';
import { formatPlanPrice, normalizeShortCodeInput } from '../utils/qrLogic';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { MobileMenuSheet } from './MobileMenuSheet';

interface PublicHomeViewProps {
  planCatalog: Record<PlanType, SubscriptionPlanConfig>;
  onGoogleLogin: () => Promise<void>;
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
    previewLine: 'SSID: DynamicQR_WiFi',
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
  planCatalog,
  onGoogleLogin,
  onOpenScanner,
  onResolveShortCode,
}) => {
  const [shortIdSearch, setShortIdSearch] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileSectionJump = (hash: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const visiblePlans = Object.values(planCatalog)
    .filter((p) => p.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeShortCodeInput(shortIdSearch);
    if (!code) return;
    onResolveShortCode(code);
  };

  const handleGoogleClick = async () => {
    setAuthError('');
    setIsSigningIn(true);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setAuthError(
        err?.message || 'Unable to complete Google Sign-In. Please allow popups or try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#292824]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#F8F5EF]/95 backdrop-blur-xs border-b border-[#E6E0D6]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 sm:py-4">
          {/* Zone 1: Single wordmark */}
          <a href="#top" className="whitespace-nowrap shrink-0">
            <BrandLogo size="sm" theme="light" />
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

          {/* Zone 3: Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSignInModal(true)}
              className="min-h-[40px] px-4 sm:px-5 py-2 text-xs font-bold text-white bg-[#D97745] hover:bg-[#c56737] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              className="md:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-white border border-[#E6E0D6] text-[#292824] hover:border-[#D97745] active:scale-95 transition-transform cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Split Section */}
      <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 pt-7 sm:pt-12 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="space-y-0.5">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#D97745]">
                Dynamic QR &amp; Smart Link Management
              </p>
              <p className="text-xs font-medium text-[#6E6A63] text-left">
                <span dir="rtl">من فكرة الطباعة الثابتة إلى التوجيه السحابي الذكي</span>
              </p>
            </div>

            <h1 className="text-[30px] sm:text-5xl lg:text-[54px] font-bold tracking-tight text-[#292824] leading-[1.12] text-balance">
              Dynamic QR Codes for a <span className="text-[#D97745]">Smarter</span> World
            </h1>
            <p className="text-sm sm:text-lg text-[#6E6A63] max-w-xl leading-relaxed">
              Create, manage, and update your QR code destinations anytime without reprinting.
              Built with atomic scan limits, 6 dynamic content engines, and cloud analytics.
            </p>

            {/* Mobile-First Balanced CTA Stack: Full-Width Primary + Equal 2-Col Secondary Row */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowSignInModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[50px] bg-[#D97745] hover:bg-[#c56737] text-white text-sm font-bold rounded-2xl transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 min-h-[48px] bg-[#233229] hover:bg-[#1a261f] text-white text-xs sm:text-sm font-bold rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Camera className="w-4 h-4 text-[#D97745] shrink-0" />
                  <span>QR Scanner</span>
                </button>

                <PWAInstallButton variant="hero" showFallbackGuide className="w-full sm:w-auto" />
              </div>
            </div>

            {/* Quick Short ID Lookup Bar inside Hero */}
            <form
              id="lookup"
              onSubmit={handleLookupSubmit}
              className="max-w-lg bg-white border border-[#E6E0D6] rounded-2xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 shadow-2xs"
            >
              <Search className="w-4 h-4 text-[#6E6A63] ml-2 shrink-0" />
              <input
                type="text"
                aria-label="Lookup QR by Short ID"
                value={shortIdSearch}
                onChange={(e) => setShortIdSearch(e.target.value)}
                placeholder="Short ID (e.g. QRD-8F3K9A)"
                className="flex-1 min-w-0 bg-transparent text-xs font-mono text-[#292824] placeholder:text-[#8E897F] focus:outline-none px-1 py-2"
              />
              <button
                type="submit"
                className="min-h-[40px] px-3 sm:px-4 py-2 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#D97745] border border-[#E6E0D6] rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Inspect QR
              </button>
            </form>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E6E0D6] rounded-3xl p-5 sm:p-7 shadow-sm relative">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-[#6E6A63] block">
                    Static Printed Code
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-[#292824] whitespace-nowrap block mt-0.5">
                    /r/QRD-8F3K9A
                  </span>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#DCE9DD]/70 text-[11px] sm:text-xs font-bold text-[#2E6B3E] whitespace-nowrap shrink-0 mt-0.5">
                  Active · 2,140
                </span>
              </div>

              <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center mb-5">
                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border-2 border-[#D97745]/30 shadow-xs w-[176px] sm:w-[216px] max-w-full flex items-center justify-center">
                  <QRCodeSVG
                    value="https://dynamicqr-one.vercel.app/r/QRD-8F3K9A"
                    size={176}
                    fgColor="#292824"
                    bgColor="#FFFFFF"
                    level="H"
                    className="w-full h-auto max-w-[176px]"
                  />
                </div>
                <p className="text-[11px] sm:text-xs text-[#6E6A63] mt-3 text-center leading-relaxed">
                  Change destination X → Y in real time without reprinting
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => onResolveShortCode('QRD-8F3K9A')}
                  className="min-h-[44px] py-2.5 px-3 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center text-center leading-tight"
                >
                  Restaurant Menu
                </button>
                <button
                  type="button"
                  onClick={() => onResolveShortCode('QRD-VC4RD1')}
                  className="min-h-[44px] py-2.5 px-3 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center text-center leading-tight"
                >
                  Digital vCard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Strip below Hero — Vertical Card Stack on Mobile, Horizontal on Desktop */}
        <div
          id="architecture"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-12 pt-8 border-t border-[#E6E0D6]"
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
              desc: 'Atomic scan tracking & quota enforcement per code',
            },
            {
              icon: ShieldCheck,
              title: 'Secure & Reliable',
              desc: 'Cloud security rules & instant account status sync',
            },
            {
              icon: Cloud,
              title: 'Cloud Based',
              desc: 'Powered by Firestore & Smart Redirect Engine (/r/code)',
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-3.5 min-w-0 overflow-hidden"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="text-[13px] sm:text-sm font-bold text-[#292824] leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#6E6A63] mt-1 leading-relaxed break-words">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: 6 Dynamic Content Types Showcase */}
      <section
        id="content-types"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 border-t border-[#E6E0D6]"
      >
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <p className="text-xs font-bold text-[#D97745] mb-1">
            01. Six Dynamic Content Engines
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#292824] text-balance">
            One QR ... Endless Possibilities
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6A63] mt-2 leading-relaxed">
            Every QR code supports external redirects or interactive internal Smart Landing experiences.
            Tap any card below to test its live Smart Landing page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {SHOWCASE_TYPES.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.type}
                className="bg-white border border-[#E6E0D6] rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-[#D97745] transition-colors"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#D97745] text-white flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[15px] sm:text-base font-bold text-[#292824] truncate">
                          {card.title}
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-[#6E6A63] bg-[#F8F5EF] border border-[#E6E0D6] px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                          {card.sampleCode}
                        </span>
                      </div>
                      <p className="text-xs text-[#6E6A63] mt-0.5 leading-snug">{card.subtitle}</p>
                    </div>
                  </div>

                  {/* Simulated Mobile Screen Frame inside Card */}
                  <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-3.5 sm:p-4">
                    <span className="text-[11px] font-mono text-[#6E6A63] block mb-1">
                      Smart Landing Preview
                    </span>
                    <p className="text-sm font-bold text-[#292824] truncate">{card.previewLine}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onResolveShortCode(card.sampleCode)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FDF2EC] hover:bg-[#D97745] text-[#D97745] hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <span>{card.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Subscription Plans & Quotas (Live from Super Admin catalog) */}
      <section
        id="pricing"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 border-t border-[#E6E0D6]"
      >
        <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-8">
          <p className="text-xs font-bold text-[#D97745] mb-1">
            02. Transparent Quota Architecture
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#292824] text-balance">
            Subscription Plans &amp; Pricing
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6A63] mt-2 leading-relaxed">
            Manage thousands of dynamic QR codes with granular control over scan limits,
            auto-routing timers, and white-label branding.
          </p>

          <div className="inline-flex items-center p-1 bg-white border border-[#E6E0D6] rounded-xl mt-5">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`min-h-[38px] px-5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-[#233229] text-white'
                  : 'text-[#6E6A63] hover:text-[#292824]'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              className={`min-h-[38px] px-5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                billingCycle === 'YEARLY'
                  ? 'bg-[#233229] text-white'
                  : 'text-[#6E6A63] hover:text-[#292824]'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            visiblePlans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          } gap-4 sm:gap-5`}
        >
          {visiblePlans.map((tier) => {
            const highlighted = tier.isHighlighted;
            const price = formatPlanPrice(tier, billingCycle);
            return (
              <div
                key={tier.plan}
                className={`rounded-3xl p-5 sm:p-6 border flex flex-col justify-between ${
                  highlighted
                    ? 'bg-[#233229] text-white border-[#233229]'
                    : 'bg-white text-[#292824] border-[#E6E0D6]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold tracking-wide ${
                        highlighted ? 'text-[#D97745]' : 'text-[#6E6A63]'
                      }`}
                    >
                      {tier.plan}
                    </span>
                    {highlighted && (
                      <span className="text-[11px] font-bold text-[#D97745] bg-[#D97745]/15 px-2.5 py-0.5 rounded-lg">
                        Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mt-1">{tier.label}</h3>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      highlighted ? 'text-[#E6E0D6]' : 'text-[#6E6A63]'
                    }`}
                  >
                    {tier.tagline}
                  </p>

                  <div className="mt-4 pt-4 border-t border-current/10 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-3xl font-bold font-mono tabular-nums">
                      {price.amountText}
                    </span>
                    <span className="text-xs opacity-75 whitespace-nowrap">{price.suffix}</span>
                  </div>

                  <div className="my-5 pt-4 border-t border-current/10 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-75">Dynamic QR Codes</span>
                      <span className="font-mono font-bold tabular-nums whitespace-nowrap">
                        {tier.maxBarcodes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-75">Scans per Code</span>
                      <span className="font-mono font-bold tabular-nums whitespace-nowrap">
                        {tier.maxScansPerBarcode.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-75">Auto-Redirect</span>
                      <span className="font-mono font-bold tabular-nums whitespace-nowrap">
                        {tier.allowDirectRedirect
                          ? tier.defaultRedirectDelaySeconds === 0
                            ? 'Instant (0–30s)'
                            : `Custom (${tier.defaultRedirectDelaySeconds}s)`
                          : `Fixed ${tier.defaultRedirectDelaySeconds}s`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="opacity-75">Hide Branding</span>
                      <span className="font-bold whitespace-nowrap">
                        {tier.allowWhiteLabel ? 'White-Label' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSignInModal(true)}
                  className={`w-full min-h-[46px] py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    highlighted
                      ? 'bg-[#D97745] hover:bg-[#c56737] text-white'
                      : 'bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6]'
                  }`}
                >
                  {tier.ctaLabel || `Get Started with ${tier.label}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E6E0D6] py-8 px-4 sm:px-6 text-center text-xs text-[#6E6A63]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2">
            <img src="/icon.svg" alt="Dynamic QR" className="w-5 h-5 rounded-md" />
            <span>
              <strong className="text-[#292824]">Dynamic </strong>
              <strong className="text-[#D97745]">QR</strong> — Smart Link &amp; QR Code Management
            </span>
          </span>
          <span>Simple. Powerful. Dynamic.</span>
        </div>
      </footer>

      {/* Clean Google Sign-In Modal — Bottom Sheet on Mobile, Centered Card on Desktop */}
      {showSignInModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-back-title"
          onClick={() => setShowSignInModal(false)}
        >
          <div
            className="bg-white border border-[#E6E0D6] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 pb-8 text-center shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-[#E6E0D6] rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-center mb-4">
              <BrandLogo size="md" theme="light" />
            </div>

            <h2 id="welcome-back-title" className="text-2xl font-bold text-[#292824]">
              Welcome Back!
            </h2>
            <p className="text-xs text-[#6E6A63] mt-1 mb-6">
              Sign in with your Google account to continue to your dashboard
            </p>

            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleClick}
              className="w-full min-h-[48px] flex items-center justify-center gap-3 py-3.5 px-5 bg-[#D97745] hover:bg-[#c56737] text-white rounded-2xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-60"
            >
              <Globe className="w-4 h-4" />
              <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="my-5 sm:my-6 p-4 sm:p-5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl border border-[#E6E0D6] mb-2">
                <QRCodeSVG
                  value="https://dynamicqr-one.vercel.app"
                  size={84}
                  fgColor="#292824"
                  bgColor="#FFFFFF"
                />
              </div>
              <span className="text-[11px] text-[#6E6A63]">
                Instant Cloud Sync · Dynamic QR Engine
              </span>
            </div>

            {authError && (
              <p className="mt-4 text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowSignInModal(false)}
              className="mt-3 min-h-[40px] px-4 text-xs font-semibold text-[#6E6A63] hover:text-[#292824] cursor-pointer"
            >
              Cancel and return to homepage
            </button>
          </div>
        </div>
      )}
      {/* Modern Mobile Navigation Menu Sheet */}
      <MobileMenuSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        headerSlot={<BrandLogo size="sm" theme="light" />}
      >
        <div className="bg-white border border-[#E6E0D6] rounded-2xl divide-y divide-[#EFECE6] overflow-hidden">
          {[
            {
              hash: '#content-types',
              title: 'Content Types',
              subtitle: 'URL, Menu, vCard, WiFi, Text & Geo',
              icon: QrCode,
            },
            {
              hash: '#architecture',
              title: 'How It Works',
              subtitle: 'Static print to real-time cloud redirect',
              icon: Zap,
            },
            {
              hash: '#lookup',
              title: 'QR Lookup',
              subtitle: 'Inspect any Short ID instantly',
              icon: Search,
            },
            {
              hash: '#pricing',
              title: 'Plans & Pricing',
              subtitle: 'Compare limits, timers & white-label',
              icon: TrendingUp,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.hash}
                type="button"
                onClick={() => handleMobileSectionJump(item.hash)}
                className="w-full min-h-[60px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#F8F5EF] active:bg-[#FDF2EC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#292824] truncate">{item.title}</div>
                    <div className="text-xs text-[#6E6A63] truncate">{item.subtitle}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A49E93] shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenScanner();
            }}
            className="min-h-[52px] px-4 py-3 bg-[#233229] hover:bg-[#1a261f] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#D97745]" />
            <span>QR Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowSignInModal(true);
            }}
            className="min-h-[52px] px-4 py-3 bg-[#D97745] hover:bg-[#c56737] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <PWAInstallButton variant="card" showFallbackGuide />
      </MobileMenuSheet>
    </div>
  );
};
