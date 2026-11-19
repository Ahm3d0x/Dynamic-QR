import {
  BarcodeRecord,
  ContentType,
  GeoEventData,
  PlanType,
  RedirectMode,
  RedirectValidationState,
  SubscriptionPlanConfig,
  TextPromoData,
  UserProfile,
  VCardData,
  WifiData,
} from '../types/qr';

export type PlanDefaults = SubscriptionPlanConfig;

export const PLAN_CATALOG: Record<PlanType, SubscriptionPlanConfig> = {
  FREE: {
    plan: 'FREE',
    label: 'Free Tier',
    tagline: 'For individuals & quick tests',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    billingNote: 'Forever Free',
    maxBarcodes: 5,
    maxScansPerBarcode: 500,
    allowDirectRedirect: false,
    allowWhiteLabel: false,
    defaultRedirectDelaySeconds: 5,
    features: [
      'Up to 5 Dynamic QR Codes',
      '500 Scans per QR Code',
      'Fixed 5s Auto-Redirect timer',
      'All 6 content engines (URL, Menu, vCard, WiFi, Text, Geo)',
      'Print-ready SVG & PNG export',
    ],
    isHighlighted: false,
    isVisible: true,
    ctaLabel: 'Start Free',
    contactNote: 'Included automatically for all new accounts.',
    sortOrder: 1,
  },
  PRO: {
    plan: 'PRO',
    label: 'Professional',
    tagline: 'For restaurants, retail & creators',
    priceMonthly: 19,
    priceYearly: 190,
    currency: 'USD',
    billingNote: '/ month',
    maxBarcodes: 50,
    maxScansPerBarcode: 10000,
    allowDirectRedirect: true,
    allowWhiteLabel: true,
    defaultRedirectDelaySeconds: 2,
    features: [
      'Up to 50 Dynamic QR Codes',
      '10,000 Scans per QR Code',
      'Custom Auto-Redirect timer (0s instant – 30s)',
      'Direct Redirect & White-Label branding',
      'Atomic real-time scan activity logs',
    ],
    isHighlighted: true,
    isVisible: true,
    ctaLabel: 'Upgrade to Pro',
    contactNote: 'Contact your platform administrator to activate the Professional plan on your account.',
    sortOrder: 2,
  },
  ENTERPRISE: {
    plan: 'ENTERPRISE',
    label: 'Enterprise',
    tagline: 'For multi-branch brands & agencies',
    priceMonthly: 79,
    priceYearly: 790,
    currency: 'USD',
    billingNote: '/ month',
    maxBarcodes: 10000,
    maxScansPerBarcode: 1000000,
    allowDirectRedirect: true,
    allowWhiteLabel: true,
    defaultRedirectDelaySeconds: 0,
    features: [
      'Up to 10,000 Dynamic QR Codes',
      '1,000,000 Scans per QR Code',
      'Instant 0s Auto-Routing by default',
      'Full White-Label Smart Landing pages',
      'Priority onboarding & dedicated support',
    ],
    isHighlighted: false,
    isVisible: true,
    ctaLabel: 'Upgrade to Enterprise',
    contactNote: 'Contact your platform administrator for Enterprise activation and multi-branch billing.',
    sortOrder: 3,
  },
  CUSTOM: {
    plan: 'CUSTOM',
    label: 'Custom Plan',
    tagline: 'Tailored limits and feature controls',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    billingNote: 'Custom Quote',
    maxBarcodes: 250,
    maxScansPerBarcode: 50000,
    allowDirectRedirect: true,
    allowWhiteLabel: true,
    defaultRedirectDelaySeconds: 3,
    features: [
      'Custom QR code & scan quotas',
      'Tailored Auto-Redirect timer policy',
      'White-Label & Direct Redirect included',
      'Flexible billing & dedicated account manager',
    ],
    isHighlighted: false,
    isVisible: true,
    ctaLabel: 'Request Custom Plan',
    contactNote: 'Reach out to the platform owner to configure tailored limits and pricing for your team.',
    sortOrder: 4,
  },
};

export function getPlanDefaults(
  plan: PlanType,
  catalog: Record<PlanType, SubscriptionPlanConfig> = PLAN_CATALOG
): SubscriptionPlanConfig {
  return catalog[plan] || PLAN_CATALOG[plan] || PLAN_CATALOG.FREE;
}

export function formatPlanPrice(
  plan: Pick<SubscriptionPlanConfig, 'plan' | 'priceMonthly' | 'priceYearly' | 'currency' | 'billingNote'>,
  cycle: 'MONTHLY' | 'YEARLY'
): { amountText: string; suffix: string } {
  const amount = cycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
  if (amount <= 0) {
    if (plan.plan === 'CUSTOM' || plan.billingNote.toLowerCase().includes('custom') || plan.billingNote.toLowerCase().includes('quote')) {
      return { amountText: 'Custom', suffix: plan.billingNote || 'Tailored pricing' };
    }
    return { amountText: 'Free', suffix: plan.billingNote || 'Forever Free' };
  }

  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const upperCurrency = plan.currency.trim().toUpperCase();
  const formattedNum = amount.toLocaleString();
  const amountText = symbolMap[upperCurrency]
    ? `${symbolMap[upperCurrency]}${formattedNum}`
    : `${formattedNum} ${plan.currency.trim()}`;

  const suffix =
    cycle === 'YEARLY'
      ? plan.billingNote.toLowerCase().includes('month')
        ? '/ year'
        : plan.billingNote || '/ year'
      : plan.billingNote || '/ month';

  return { amountText, suffix };
}

export function sanitizeSubscriptionPlan(
  input: SubscriptionPlanConfig
): Omit<SubscriptionPlanConfig, 'updatedAt'> {
  const cleanFeatures = (Array.isArray(input.features) ? input.features : [])
    .map((f) => String(f || '').trim().slice(0, 120))
    .filter((f) => f.length > 0)
    .slice(0, 12);

  return {
    plan: input.plan,
    label: (input.label || input.plan).trim().slice(0, 60) || input.plan,
    tagline: (input.tagline || 'Dynamic QR subscription plan').trim().slice(0, 160),
    priceMonthly: Math.min(100000, Math.max(0, Number(input.priceMonthly) || 0)),
    priceYearly: Math.min(1000000, Math.max(0, Number(input.priceYearly) || 0)),
    currency: (input.currency || 'USD').trim().slice(0, 10) || 'USD',
    billingNote: (input.billingNote || '').trim().slice(0, 80),
    maxBarcodes: Math.min(1000000, Math.max(0, Math.round(Number(input.maxBarcodes) || 0))),
    maxScansPerBarcode: Math.min(
      100000000,
      Math.max(1, Math.round(Number(input.maxScansPerBarcode) || 1))
    ),
    allowDirectRedirect: Boolean(input.allowDirectRedirect),
    allowWhiteLabel: Boolean(input.allowWhiteLabel),
    defaultRedirectDelaySeconds: clampRedirectDelay(Number(input.defaultRedirectDelaySeconds)),
    features: cleanFeatures,
    isHighlighted: Boolean(input.isHighlighted),
    isVisible: Boolean(input.isVisible),
    ctaLabel: (input.ctaLabel || `Choose ${input.plan}`).trim().slice(0, 60),
    contactNote: (input.contactNote || '').trim().slice(0, 200),
    sortOrder: Math.min(20, Math.max(0, Math.round(Number(input.sortOrder) || 0))),
  };
}

export function generateShortCode(seed?: string): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (seed && /^[A-Z0-9]{6}$/.test(seed)) {
    return `QRD-${seed}`;
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * alphabet.length);
    code += alphabet[idx];
  }
  return `QRD-${code}`;
}

export function normalizeShortCodeInput(raw: string): string {
  const cleaned = raw.trim().toUpperCase();
  if (!cleaned) return '';
  // If user pasted full URL like https://domain.com/r/QRD-8F3K9A
  const match = cleaned.match(/QRD-[A-Z0-9_-]{3,20}/i);
  if (match) return match[0].toUpperCase();
  if (cleaned.startsWith('QRD-')) return cleaned;
  if (/^[A-Z0-9]{4,12}$/.test(cleaned)) return `QRD-${cleaned}`;
  return cleaned;
}

export function buildShortLinkUrl(shortCode: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://qrdynamic.app');
  return `${base.replace(/\/$/, '')}/r/${encodeURIComponent(shortCode)}`;
}

export function canUserCreateBarcode(user: Pick<UserProfile, 'status' | 'maxBarcodes'>, activeBarcodesCount: number): {
  allowed: boolean;
  reason?: string;
} {
  if (user.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Your account is currently suspended.' };
  }
  if (activeBarcodesCount >= user.maxBarcodes) {
    return {
      allowed: false,
      reason: `Plan quota reached (${activeBarcodesCount}/${user.maxBarcodes} QR codes). Upgrade your plan to create more.`,
    };
  }
  return { allowed: true };
}

export function clampRedirectDelay(seconds: number): number {
  if (!Number.isFinite(seconds)) return 5;
  return Math.min(30, Math.max(0, Math.round(seconds)));
}

export function enforcePlanFeatureConstraints(
  user: Pick<UserProfile, 'allowDirectRedirect' | 'allowWhiteLabel' | 'defaultRedirectDelaySeconds'>,
  requestedMode: RedirectMode,
  requestedHideBranding: boolean,
  requestedDelaySeconds?: number
): { redirectMode: RedirectMode; hideBranding: boolean; redirectDelaySeconds: number } {
  const planLockedDelay =
    typeof user.defaultRedirectDelaySeconds === 'number'
      ? clampRedirectDelay(user.defaultRedirectDelaySeconds)
      : user.allowDirectRedirect
      ? 0
      : 5;

  const effectiveMode: RedirectMode = user.allowDirectRedirect ? requestedMode : 'LANDING';
  const effectiveDelay = user.allowDirectRedirect
    ? typeof requestedDelaySeconds === 'number'
      ? clampRedirectDelay(requestedDelaySeconds)
      : effectiveMode === 'DIRECT'
      ? 0
      : planLockedDelay
    : planLockedDelay;

  return {
    redirectMode: effectiveMode,
    hideBranding: user.allowWhiteLabel ? requestedHideBranding : false,
    redirectDelaySeconds: effectiveDelay,
  };
}

export function resolveAutoRedirectDelay(
  barcode: Pick<BarcodeRecord, 'type' | 'redirectMode' | 'redirectDelaySeconds'>
): number | null {
  if (barcode.type !== 'URL') return null;
  if (typeof barcode.redirectDelaySeconds === 'number' && Number.isFinite(barcode.redirectDelaySeconds)) {
    return clampRedirectDelay(barcode.redirectDelaySeconds);
  }
  return barcode.redirectMode === 'DIRECT' ? 0 : 5;
}

export function validateDestinationPayload(type: ContentType, destination: string): boolean {
  const trimmed = destination.trim();
  if (!trimmed || trimmed.length > 2000) return false;

  switch (type) {
    case 'URL':
    case 'IMAGE': {
      if (type === 'IMAGE' && trimmed.startsWith('/')) {
        return trimmed.length > 1;
      }
      try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }
    case 'TEXT': {
      return trimmed.length >= 1;
    }
    case 'VCARD': {
      try {
        const data = JSON.parse(trimmed) as Partial<VCardData>;
        return Boolean(data && typeof data.fullName === 'string' && data.fullName.trim().length > 0);
      } catch {
        return trimmed.length > 2;
      }
    }
    case 'WIFI': {
      try {
        const data = JSON.parse(trimmed) as Partial<WifiData>;
        return Boolean(data && typeof data.ssid === 'string' && data.ssid.trim().length > 0);
      } catch {
        return trimmed.length > 2;
      }
    }
    case 'GEO_EVENT': {
      try {
        const data = JSON.parse(trimmed) as Partial<GeoEventData>;
        return Boolean(
          data &&
            ((typeof data.latitude === 'string' && data.latitude.trim().length > 0) ||
              (typeof data.address === 'string' && data.address.trim().length > 0))
        );
      } catch {
        return trimmed.length > 2;
      }
    }
    default:
      return false;
  }
}

export function evaluateSmartRedirect(barcode: BarcodeRecord | null | undefined): RedirectValidationState {
  if (!barcode || barcode.isDeleted) {
    return {
      status: 'CODE_NOT_FOUND',
      message: 'This QR code does not exist or has been removed.',
    };
  }

  if (barcode.ownerStatus === 'SUSPENDED') {
    return {
      status: 'ACCOUNT_SUSPENDED',
      message: 'The owner account associated with this QR code is currently suspended.',
    };
  }

  if (!barcode.codeActive) {
    return {
      status: 'QR_CODE_DISABLED',
      message: 'This QR code has been temporarily paused by its owner.',
    };
  }

  if (barcode.scanCount >= barcode.maxScansLimit) {
    return {
      status: 'SCAN_LIMIT_REACHED',
      message: `This QR code has reached its maximum scan limit (${barcode.maxScansLimit.toLocaleString()} scans).`,
    };
  }

  if (!validateDestinationPayload(barcode.type, barcode.destination)) {
    return {
      status: 'INVALID_DESTINATION',
      message: 'The destination configured for this QR code is invalid or incomplete.',
    };
  }

  // Only URL and IMAGE types can execute an immediate external window redirect in DIRECT mode;
  // rich types (TEXT, VCARD, WIFI, GEO_EVENT) render through the Smart Landing experience.
  const effectiveMode: RedirectMode =
    barcode.redirectMode === 'DIRECT' && barcode.type === 'URL' ? 'DIRECT' : 'LANDING';

  return {
    status: 'OK',
    mode: effectiveMode,
    barcode,
  };
}

export function parseTextPromo(destination: string): TextPromoData {
  try {
    const parsed = JSON.parse(destination);
    if (parsed && typeof parsed === 'object' && 'headline' in parsed) {
      return {
        headline: String(parsed.headline || 'Special Announcement'),
        body: String(parsed.body || ''),
        promoCode: String(parsed.promoCode || ''),
      };
    }
  } catch {
    // Plain text fallback
  }
  return {
    headline: 'Announcement',
    body: destination,
    promoCode: '',
  };
}

export function parseVCard(destination: string): VCardData {
  try {
    const parsed = JSON.parse(destination);
    return {
      fullName: String(parsed.fullName || 'Contact Name'),
      jobTitle: String(parsed.jobTitle || ''),
      company: String(parsed.company || ''),
      phone: String(parsed.phone || ''),
      email: String(parsed.email || ''),
      website: String(parsed.website || ''),
    };
  } catch {
    return {
      fullName: destination,
      jobTitle: '',
      company: '',
      phone: '',
      email: '',
      website: '',
    };
  }
}

export function formatVCardDownloadString(vcard: VCardData): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${vcard.fullName}`,
    vcard.company ? `ORG:${vcard.company}` : '',
    vcard.jobTitle ? `TITLE:${vcard.jobTitle}` : '',
    vcard.phone ? `TEL;TYPE=CELL:${vcard.phone}` : '',
    vcard.email ? `EMAIL:${vcard.email}` : '',
    vcard.website ? `URL:${vcard.website}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n');
}

export function parseWifi(destination: string): WifiData {
  try {
    const parsed = JSON.parse(destination);
    return {
      ssid: String(parsed.ssid || 'QRDynamic_WiFi'),
      password: String(parsed.password || ''),
      encryption: parsed.encryption === 'WEP' || parsed.encryption === 'nopass' ? parsed.encryption : 'WPA',
    };
  } catch {
    return {
      ssid: destination || 'QRDynamic_WiFi',
      password: '',
      encryption: 'WPA',
    };
  }
}

export function parseGeoEvent(destination: string): GeoEventData {
  try {
    const parsed = JSON.parse(destination);
    return {
      placeName: String(parsed.placeName || 'Pinned Location'),
      latitude: String(parsed.latitude || '25.2048'),
      longitude: String(parsed.longitude || '55.2708'),
      address: String(parsed.address || ''),
    };
  } catch {
    return {
      placeName: 'Location',
      latitude: '25.2048',
      longitude: '55.2708',
      address: destination,
    };
  }
}

export function buildGoogleMapsUrl(geo: GeoEventData): string {
  if (geo.latitude && geo.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${geo.latitude},${geo.longitude}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(geo.address || geo.placeName)}`;
}
