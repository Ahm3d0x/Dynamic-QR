import React, { useEffect, useState } from 'react';
import { Check, Plus, Sliders, Trash2, X } from 'lucide-react';
import { SubscriptionPlanConfig } from '../types/qr';
import { clampRedirectDelay, sanitizeSubscriptionPlan } from '../utils/qrLogic';

interface EditPlanModalProps {
  planConfig: SubscriptionPlanConfig | null;
  subscribersOnPlanCount: number;
  onClose: () => void;
  onSavePlan: (
    updatedPlan: SubscriptionPlanConfig,
    syncExistingSubscribers: boolean
  ) => Promise<void>;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  planConfig,
  subscribersOnPlanCount,
  onClose,
  onSavePlan,
}) => {
  const [label, setLabel] = useState('');
  const [tagline, setTagline] = useState('');
  const [priceMonthly, setPriceMonthly] = useState<number>(0);
  const [priceYearly, setPriceYearly] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [billingNote, setBillingNote] = useState('/ month');
  const [maxBarcodes, setMaxBarcodes] = useState<number>(5);
  const [maxScansPerBarcode, setMaxScansPerBarcode] = useState<number>(500);
  const [allowDirectRedirect, setAllowDirectRedirect] = useState(false);
  const [allowWhiteLabel, setAllowWhiteLabel] = useState(false);
  const [defaultRedirectDelaySeconds, setDefaultRedirectDelaySeconds] = useState<number>(5);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [ctaLabel, setCtaLabel] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [syncExistingSubscribers, setSyncExistingSubscribers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!planConfig) return;
    setLabel(planConfig.label);
    setTagline(planConfig.tagline);
    setPriceMonthly(planConfig.priceMonthly);
    setPriceYearly(planConfig.priceYearly);
    setCurrency(planConfig.currency);
    setBillingNote(planConfig.billingNote);
    setMaxBarcodes(planConfig.maxBarcodes);
    setMaxScansPerBarcode(planConfig.maxScansPerBarcode);
    setAllowDirectRedirect(planConfig.allowDirectRedirect);
    setAllowWhiteLabel(planConfig.allowWhiteLabel);
    setDefaultRedirectDelaySeconds(planConfig.defaultRedirectDelaySeconds);
    setFeatures([...planConfig.features]);
    setNewFeatureText('');
    setIsHighlighted(planConfig.isHighlighted);
    setIsVisible(planConfig.isVisible);
    setCtaLabel(planConfig.ctaLabel);
    setContactNote(planConfig.contactNote);
    setSortOrder(planConfig.sortOrder);
    setSyncExistingSubscribers(true);
    setErrorMsg('');
  }, [planConfig]);

  if (!planConfig) return null;

  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim().slice(0, 120);
    if (!trimmed || features.length >= 12) return;
    setFeatures((prev) => [...prev, trimmed]);
    setNewFeatureText('');
  };

  const handleUpdateFeature = (idx: number, val: string) => {
    setFeatures((prev) => prev.map((item, i) => (i === idx ? val.slice(0, 120) : item)));
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!label.trim()) {
      setErrorMsg('Plan display name is required.');
      return;
    }

    const sanitized = sanitizeSubscriptionPlan({
      plan: planConfig.plan,
      label,
      tagline,
      priceMonthly,
      priceYearly,
      currency,
      billingNote,
      maxBarcodes,
      maxScansPerBarcode,
      allowDirectRedirect,
      allowWhiteLabel,
      defaultRedirectDelaySeconds,
      features,
      isHighlighted,
      isVisible,
      ctaLabel,
      contactNote,
      sortOrder,
    });

    setSaving(true);
    try {
      await onSavePlan(sanitized, syncExistingSubscribers);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save plan settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-plan-modal-title"
    >
      <div className="bg-white border border-[#E6E0D6] rounded-2xl max-w-2xl w-full p-6 md:p-7 shadow-xl my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="edit-plan-modal-title" className="text-lg font-bold text-[#292824]">
                Edit Plan · {planConfig.plan}
              </h2>
              <p className="text-xs text-[#6E6A63]">
                Changes sync immediately to all Admin Plans pages & Public Pricing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Plan Editor"
            className="p-2 rounded-lg text-[#6E6A63] hover:text-[#292824] hover:bg-[#F8F5EF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 py-5">
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-plan-label"
                className="block text-xs font-semibold text-[#292824] mb-1"
              >
                Plan Display Name
              </label>
              <input
                id="edit-plan-label"
                type="text"
                maxLength={60}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm text-[#292824] focus:outline-none focus:border-[#D97745]"
              />
            </div>

            <div>
              <label
                htmlFor="edit-plan-cta"
                className="block text-xs font-semibold text-[#292824] mb-1"
              >
                Button Label (CTA)
              </label>
              <input
                id="edit-plan-cta"
                type="text"
                maxLength={60}
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Upgrade to Pro"
                className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm text-[#292824] focus:outline-none focus:border-[#D97745]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="edit-plan-tagline"
                className="block text-xs font-semibold text-[#292824] mb-1"
              >
                Short Description / Tagline
              </label>
              <input
                id="edit-plan-tagline"
                type="text"
                maxLength={160}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm text-[#292824] focus:outline-none focus:border-[#D97745]"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-4 bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl space-y-3">
            <span className="text-xs font-bold text-[#292824] block">Pricing & Currency</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="edit-plan-currency"
                  className="block text-[11px] font-semibold text-[#6E6A63] mb-1"
                >
                  Currency
                </label>
                <input
                  id="edit-plan-currency"
                  type="text"
                  maxLength={10}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="USD / EGP / SAR"
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-mono font-bold text-[#292824]"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-plan-monthly"
                  className="block text-[11px] font-semibold text-[#6E6A63] mb-1"
                >
                  Monthly Price
                </label>
                <input
                  id="edit-plan-monthly"
                  type="number"
                  min={0}
                  max={100000}
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-mono tabular-nums text-[#292824]"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-plan-yearly"
                  className="block text-[11px] font-semibold text-[#6E6A63] mb-1"
                >
                  Yearly Price
                </label>
                <input
                  id="edit-plan-yearly"
                  type="number"
                  min={0}
                  max={1000000}
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-mono tabular-nums text-[#292824]"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-plan-billing-note"
                  className="block text-[11px] font-semibold text-[#6E6A63] mb-1"
                >
                  Billing Suffix
                </label>
                <input
                  id="edit-plan-billing-note"
                  type="text"
                  maxLength={80}
                  value={billingNote}
                  onChange={(e) => setBillingNote(e.target.value)}
                  placeholder="/ month"
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs text-[#292824]"
                />
              </div>
            </div>
          </div>

          {/* Quotas & Auto-Routing Rules */}
          <div className="p-4 bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl space-y-3">
            <span className="text-xs font-bold text-[#292824] block">
              Quotas, Auto-Routing & Permissions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="edit-plan-max-codes"
                  className="block text-[11px] font-semibold text-[#6E6A63] mb-1"
                >
                  Max Dynamic QR Codes
                </label>
                <input
                  id="edit-plan-max-codes"
                  type="number"
                  min={0}
                  max={1000000}
                  value={maxBarcodes}
                  onChange={(e) => setMaxBarcodes(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-mono tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-plan-max-scans"
                  className="block text-[11px] font-semibold text-[#6E6A63] mb-1"
                >
                  Max Scans per Code
                </label>
                <input
                  id="edit-plan-max-scans"
                  type="number"
                  min={1}
                  max={100000000}
                  value={maxScansPerBarcode}
                  onChange={(e) => setMaxScansPerBarcode(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-mono tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-plan-delay"
                  className="block text-[11px] font-semibold text-[#6E6A63] mb-1"
                >
                  Auto-Redirect Delay (0–30s)
                </label>
                <input
                  id="edit-plan-delay"
                  type="number"
                  min={0}
                  max={30}
                  value={defaultRedirectDelaySeconds}
                  onChange={(e) =>
                    setDefaultRedirectDelaySeconds(clampRedirectDelay(Number(e.target.value)))
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <label className="flex items-center justify-between p-2.5 bg-white border border-[#E6E0D6] rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-[#292824]">Direct Route</span>
                <input
                  type="checkbox"
                  checked={allowDirectRedirect}
                  onChange={(e) => setAllowDirectRedirect(e.target.checked)}
                  className="w-4 h-4 accent-[#D97745]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-[#E6E0D6] rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-[#292824]">White-Label</span>
                <input
                  type="checkbox"
                  checked={allowWhiteLabel}
                  onChange={(e) => setAllowWhiteLabel(e.target.checked)}
                  className="w-4 h-4 accent-[#D97745]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-[#E6E0D6] rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-[#292824]">Highlight Card</span>
                <input
                  type="checkbox"
                  checked={isHighlighted}
                  onChange={(e) => setIsHighlighted(e.target.checked)}
                  className="w-4 h-4 accent-[#D97745]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white border border-[#E6E0D6] rounded-xl cursor-pointer">
                <span className="text-[11px] font-semibold text-[#292824]">Visible</span>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="w-4 h-4 accent-[#D97745]"
                />
              </label>
            </div>
          </div>

          {/* Features Checklist Editor */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#292824]">
                Plan Feature Highlights ({features.length}/12)
              </span>
              <span className="text-[11px] text-[#6E6A63]">
                Shown as checklist items on the Admin Plans page
              </span>
            </div>

            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label={`Plan feature ${idx + 1}`}
                    value={feat}
                    maxLength={120}
                    onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs text-[#292824]"
                  />
                  <button
                    type="button"
                    aria-label={`Remove feature ${idx + 1}`}
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-2 text-[#6E6A63] hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {features.length < 12 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFeatureText}
                  maxLength={120}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="Add a new feature line (e.g. Dedicated WhatsApp Support)..."
                  className="flex-1 px-3 py-2 bg-white border border-dashed border-[#D97745]/60 rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#D97745]"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#D97745] border border-[#E6E0D6] rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            )}
          </div>

          {/* Upgrade / Contact Instructions */}
          <div>
            <label
              htmlFor="edit-plan-contact-note"
              className="block text-xs font-semibold text-[#292824] mb-1"
            >
              Upgrade / Activation Instructions (Shown when Admin selects this plan)
            </label>
            <textarea
              id="edit-plan-contact-note"
              rows={2}
              maxLength={200}
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="e.g. Message us on WhatsApp (+20...) or email billing@domain.com to upgrade instantly."
              className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#D97745]"
            />
          </div>

          {/* Sync existing subscribers option */}
          {subscribersOnPlanCount > 0 && (
            <label className="flex items-start gap-2.5 p-3.5 bg-[#FDF2EC] border border-[#D97745]/30 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={syncExistingSubscribers}
                onChange={(e) => setSyncExistingSubscribers(e.target.checked)}
                className="w-4 h-4 accent-[#D97745] mt-0.5"
              />
              <span className="text-xs text-[#292824]">
                <strong>Sync updated limits & routing timer</strong> to all{' '}
                <strong className="font-mono">{subscribersOnPlanCount}</strong> existing
                subscriber(s) currently on the <strong>{planConfig.plan}</strong> plan.
              </span>
            </label>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EFECE6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#6E6A63] text-xs font-semibold rounded-xl border border-[#E6E0D6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Publishing Changes...' : 'Save & Publish Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
