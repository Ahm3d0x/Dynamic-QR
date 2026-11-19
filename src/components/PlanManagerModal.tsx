import React, { useEffect, useState } from 'react';
import { Crown, X, Check } from 'lucide-react';
import { AccountStatus, PlanType, SubscriptionPlanConfig, UserProfile, UserRole } from '../types/qr';
import { clampRedirectDelay, getPlanDefaults } from '../utils/qrLogic';

interface PlanManagerModalProps {
  subscriber: UserProfile | null;
  planCatalog: Record<PlanType, SubscriptionPlanConfig>;
  onClose: () => void;
  onSaveSubscriber: (
    uid: string,
    updates: Pick<
      UserProfile,
      | 'plan'
      | 'maxBarcodes'
      | 'maxScansPerBarcode'
      | 'allowDirectRedirect'
      | 'allowWhiteLabel'
      | 'defaultRedirectDelaySeconds'
      | 'status'
      | 'role'
    >
  ) => Promise<void>;
}

export const PlanManagerModal: React.FC<PlanManagerModalProps> = ({
  subscriber,
  planCatalog,
  onClose,
  onSaveSubscriber,
}) => {
  const [plan, setPlan] = useState<PlanType>('FREE');
  const [maxBarcodes, setMaxBarcodes] = useState<number>(5);
  const [maxScansPerBarcode, setMaxScansPerBarcode] = useState<number>(500);
  const [allowDirectRedirect, setAllowDirectRedirect] = useState<boolean>(false);
  const [allowWhiteLabel, setAllowWhiteLabel] = useState<boolean>(false);
  const [defaultRedirectDelaySeconds, setDefaultRedirectDelaySeconds] = useState<number>(5);
  const [status, setStatus] = useState<AccountStatus>('ACTIVE');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!subscriber) return;
    setPlan(subscriber.plan);
    setMaxBarcodes(subscriber.maxBarcodes);
    setMaxScansPerBarcode(subscriber.maxScansPerBarcode);
    setAllowDirectRedirect(subscriber.allowDirectRedirect);
    setAllowWhiteLabel(subscriber.allowWhiteLabel);
    setDefaultRedirectDelaySeconds(
      typeof subscriber.defaultRedirectDelaySeconds === 'number'
        ? clampRedirectDelay(subscriber.defaultRedirectDelaySeconds)
        : getPlanDefaults(subscriber.plan, planCatalog).defaultRedirectDelaySeconds
    );
    setStatus(subscriber.status);
    setRole(subscriber.role);
  }, [subscriber, planCatalog]);

  if (!subscriber) return null;

  const handlePlanChange = (newPlan: PlanType) => {
    setPlan(newPlan);
    if (newPlan !== 'CUSTOM') {
      const defaults = getPlanDefaults(newPlan, planCatalog);
      setMaxBarcodes(defaults.maxBarcodes);
      setMaxScansPerBarcode(defaults.maxScansPerBarcode);
      setAllowDirectRedirect(defaults.allowDirectRedirect);
      setAllowWhiteLabel(defaults.allowWhiteLabel);
      setDefaultRedirectDelaySeconds(defaults.defaultRedirectDelaySeconds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSubscriber(subscriber.uid, {
        plan,
        maxBarcodes: Math.max(0, Number(maxBarcodes) || 0),
        maxScansPerBarcode: Math.max(1, Number(maxScansPerBarcode) || 1),
        allowDirectRedirect,
        allowWhiteLabel,
        defaultRedirectDelaySeconds: clampRedirectDelay(Number(defaultRedirectDelaySeconds)),
        status,
        role,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-manager-title"
    >
      <div className="bg-white border border-[#E6E0D6] rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 id="plan-manager-title" className="text-lg font-bold text-[#292824]">
                Plan & Quota Manager
              </h2>
              <p className="text-xs text-[#6E6A63]">
                {subscriber.name} · {subscriber.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Plan & Quota Manager"
            className="p-2 rounded-lg text-[#6E6A63] hover:text-[#292824] hover:bg-[#F8F5EF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-5">
          <div>
            <label
              htmlFor="plan-select"
              className="block text-xs font-semibold text-[#292824] mb-1.5"
            >
              Plan Type
            </label>
            <select
              id="plan-select"
              value={plan}
              onChange={(e) => handlePlanChange(e.target.value as PlanType)}
              className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-semibold text-[#292824] focus:outline-none focus:border-[#D97745]"
            >
              <option value="FREE">Free Tier (5 Codes · 500 Scans)</option>
              <option value="PRO">Pro Plan (50 Codes · 10,000 Scans)</option>
              <option value="ENTERPRISE">Enterprise (10,000 Codes · 1,000,000 Scans)</option>
              <option value="CUSTOM">Custom Plan (Manual Quotas)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="max-barcodes-input"
                className="block text-xs font-semibold text-[#292824] mb-1.5"
              >
                Max Barcodes
              </label>
              <input
                id="max-barcodes-input"
                type="number"
                min={0}
                value={maxBarcodes}
                onChange={(e) => {
                  setPlan('CUSTOM');
                  setMaxBarcodes(Number(e.target.value));
                }}
                className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="max-scans-input"
                className="block text-xs font-semibold text-[#292824] mb-1.5"
              >
                Max Scans per Code
              </label>
              <input
                id="max-scans-input"
                type="number"
                min={1}
                value={maxScansPerBarcode}
                onChange={(e) => {
                  setPlan('CUSTOM');
                  setMaxScansPerBarcode(Number(e.target.value));
                }}
                className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center justify-between p-3 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-[#292824]">Direct Redirect</span>
              <input
                type="checkbox"
                checked={allowDirectRedirect}
                onChange={(e) => setAllowDirectRedirect(e.target.checked)}
                className="w-4 h-4 accent-[#D97745]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl cursor-pointer">
              <span className="text-xs font-semibold text-[#292824]">White-Label</span>
              <input
                type="checkbox"
                checked={allowWhiteLabel}
                onChange={(e) => setAllowWhiteLabel(e.target.checked)}
                className="w-4 h-4 accent-[#D97745]"
              />
            </label>
          </div>

          <div>
            <label
              htmlFor="redirect-delay-input"
              className="block text-xs font-semibold text-[#292824] mb-1.5"
            >
              Auto-Redirect Delay (seconds · 0 = instant)
            </label>
            <div className="flex items-center gap-2.5">
              <input
                id="redirect-delay-input"
                type="number"
                min={0}
                max={30}
                value={defaultRedirectDelaySeconds}
                onChange={(e) => {
                  setDefaultRedirectDelaySeconds(clampRedirectDelay(Number(e.target.value)));
                }}
                className="w-24 px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono tabular-nums"
              />
              <span className="text-[11px] text-[#6E6A63]">
                {allowDirectRedirect
                  ? 'Default timer (subscriber can customize 0–30s per URL QR)'
                  : 'Fixed enforced timer for this subscriber (locked on Free)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="account-status-select"
                className="block text-xs font-semibold text-[#292824] mb-1.5"
              >
                Account Status
              </label>
              <select
                id="account-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs font-semibold text-[#292824]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED (Blocks All QRs)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="account-role-select"
                className="block text-xs font-semibold text-[#292824] mb-1.5"
              >
                Platform Role
              </label>
              <select
                id="account-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs font-semibold text-[#292824]"
              >
                <option value="ADMIN">ADMIN (Subscriber)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
          </div>

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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
