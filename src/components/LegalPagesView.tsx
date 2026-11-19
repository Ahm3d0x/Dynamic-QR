import React from 'react';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface LegalPagesViewProps {
  page: 'PRIVACY' | 'TERMS';
  onBackHome: () => void;
  onSwitchPage: (page: 'PRIVACY' | 'TERMS') => void;
}

export const LegalPagesView: React.FC<LegalPagesViewProps> = ({
  page,
  onBackHome,
  onSwitchPage,
}) => {
  const isPrivacy = page === 'PRIVACY';

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#292824] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#F8F5EF]/95 backdrop-blur-xs border-b border-[#E6E0D6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <BrandLogo size="sm" theme="light" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSwitchPage(isPrivacy ? 'TERMS' : 'PRIVACY')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#E6E0D6] hover:border-[#D97745] text-xs font-semibold text-[#292824] transition-colors cursor-pointer"
            >
              {isPrivacy ? 'Terms of Service' : 'Privacy Policy'}
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#233229] hover:bg-[#1a261f] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white border border-[#E6E0D6] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-start gap-3.5 pb-6 border-b border-[#EFECE6]">
            <div className="w-11 h-11 rounded-2xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center shrink-0">
              {isPrivacy ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#D97745]">
                Dynamic QR Legal
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#292824] mt-0.5">
                {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
              </h1>
              <p className="text-xs text-[#6E6A63] mt-1">
                Last updated: November 2026 · Dynamic QR (dynamicqr-one.vercel.app)
              </p>
            </div>
          </div>

          {isPrivacy ? (
            <div className="space-y-5 text-sm text-[#4A4741] leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">1. Information We Collect</h2>
                <p>
                  When you sign in to <strong>Dynamic QR</strong> using Google Sign-In, we receive
                  only your basic Google profile details (name, email address, and unique account
                  identifier) strictly to create and authenticate your workspace account.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">2. QR Code &amp; Scan Data</h2>
                <p>
                  We store the dynamic QR configurations you create (titles, destination URLs,
                  content types, styling, and redirect timers) in Google Cloud Firestore. When a
                  visitor scans one of your QR codes, we record basic anonymous scan metrics
                  (timestamp and general browser/device summary) to power your scan analytics and
                  enforce scan quotas.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">3. How We Use Information</h2>
                <p>
                  Your information is used solely to operate Dynamic QR, maintain persistent
                  authenticated sessions, sync your dynamic links in real time, and manage
                  subscription plan limits. We never sell, rent, or trade your personal data to
                  third parties.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">4. Data Security &amp; Retention</h2>
                <p>
                  All authentication and database operations are secured via Firebase Authentication
                  and strict Firestore Security Rules. You may soft-delete your QR codes anytime
                  from your dashboard or contact us to request complete account deletion.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">5. Contact</h2>
                <p>
                  For privacy inquiries or data deletion requests, contact us at{' '}
                  <a
                    href="mailto:ah2005211@gmail.com"
                    className="text-[#D97745] font-semibold hover:underline"
                  >
                    ah2005211@gmail.com
                  </a>
                  .
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-5 text-sm text-[#4A4741] leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using <strong>Dynamic QR</strong>, you agree to be bound by these
                  Terms of Service and all applicable laws and regulations.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">2. Acceptable Use</h2>
                <p>
                  You are solely responsible for the destinations and content linked through your
                  dynamic QR codes. You agree not to use Dynamic QR to distribute malware, phishing
                  pages, illegal material, or deceptive redirects. Accounts violating this policy
                  may be suspended.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">3. Plans &amp; Quotas</h2>
                <p>
                  Each account is assigned a subscription plan defining maximum active QR codes,
                  scan limits per code, auto-redirect timing options, and white-label capabilities.
                  When a scan quota is reached, visitors will see a graceful notice until the quota
                  is upgraded.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">4. Service Availability</h2>
                <p>
                  Dynamic QR is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo;
                  basis. While we strive for high uptime via cloud infrastructure, we are not liable
                  for temporary interruptions beyond our reasonable control.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#292824]">5. Contact</h2>
                <p>
                  Questions regarding these terms may be sent to{' '}
                  <a
                    href="mailto:ah2005211@gmail.com"
                    className="text-[#D97745] font-semibold hover:underline"
                  >
                    ah2005211@gmail.com
                  </a>
                  .
                </p>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
