import {
  BarcodeRecord,
  ContentType,
  GeoEventData,
  PlanType,
  RedirectMode,
  RedirectValidationState,
  TextPromoData,
  UserProfile,
  VCardData,
  WifiData,
} from '../types/qr';

export interface PlanDefaults {
  plan: PlanType;
  label: string;
  tagline: string;
  maxBarcodes: number;
  maxScansPerBarcode: number;
  allowDirectRedirect: boolean;
  allowWhiteLabel: boolean;
}

export const PLAN_CATALOG: Record<PlanType, PlanDefaults> = {
  FREE: {
    plan: 'FREE',
    label: 'Free Tier',
    tagline: 'For individuals & quick tests',
    maxBarcodes: 5,
    maxScansPerBarcode: 500,
    allowDirectRedirect: false,
    allowWhiteLabel: false,
  },
  PRO: {
    plan: 'PRO',
    label: 'Professional',
    tagline: 'For restaurants, retail & creators',
    maxBarcodes: 50,
    maxScansPerBarcode: 10000,
    allowDirectRedirect: true,
    allowWhiteLabel: true,
  },
  ENTERPRISE: {
    plan: 'ENTERPRISE',
    label: 'Enterprise',
    tagline: 'For multi-branch brands & agencies',
    maxBarcodes: 10000,
    maxScansPerBarcode: 1000000,
    allowDirectRedirect: true,
    allowWhiteLabel: true,
  },
  CUSTOM: {
    plan: 'CUSTOM',
    label: 'Custom Plan',
    tagline: 'Tailored limits and feature controls',
    maxBarcodes: 250,
    maxScansPerBarcode: 50000,
    allowDirectRedirect: true,
    allowWhiteLabel: true,
  },
};

export function getPlanDefaults(plan: PlanType): PlanDefaults {
  return PLAN_CATALOG[plan] || PLAN_CATALOG.FREE;
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

export function enforcePlanFeatureConstraints(
  user: Pick<UserProfile, 'allowDirectRedirect' | 'allowWhiteLabel'>,
  requestedMode: RedirectMode,
  requestedHideBranding: boolean
): { redirectMode: RedirectMode; hideBranding: boolean } {
  return {
    redirectMode: user.allowDirectRedirect ? requestedMode : 'LANDING',
    hideBranding: user.allowWhiteLabel ? requestedHideBranding : false,
  };
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
