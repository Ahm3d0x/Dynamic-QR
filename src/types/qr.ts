export type UserRole = 'ADMIN' | 'SUPER_ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
export type ContentType = 'URL' | 'TEXT' | 'IMAGE' | 'VCARD' | 'WIFI' | 'GEO_EVENT';
export type RedirectMode = 'DIRECT' | 'LANDING';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  plan: PlanType;
  maxBarcodes: number;
  maxScansPerBarcode: number;
  allowDirectRedirect: boolean;
  allowWhiteLabel: boolean;
  defaultRedirectDelaySeconds?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface BarcodeRecord {
  shortCode: string;
  ownerId: string;
  ownerEmail: string;
  ownerStatus: AccountStatus;
  title: string;
  type: ContentType;
  destination: string;
  redirectMode: RedirectMode;
  redirectDelaySeconds?: number;
  welcomeMessage: string;
  ctaText: string;
  qrColor: string;
  hideBranding: boolean;
  codeActive: boolean;
  isDeleted: boolean;
  scanCount: number;
  maxScansLimit: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ScanLogRecord {
  id: string;
  barcodeId: string;
  ownerId: string;
  title: string;
  deviceInfo: string;
  timestamp?: any;
}

export interface VCardData {
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
}

export interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
}

export interface GeoEventData {
  placeName: string;
  latitude: string;
  longitude: string;
  address: string;
}

export interface TextPromoData {
  headline: string;
  body: string;
  promoCode: string;
}

export interface SuperAdminInviteRecord {
  id: string;
  email: string;
  role: UserRole;
  plan: PlanType;
  invitedBy: string;
  createdAt?: any;
}

export interface SubscriptionPlanConfig {
  plan: PlanType;
  label: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  billingNote: string;
  maxBarcodes: number;
  maxScansPerBarcode: number;
  allowDirectRedirect: boolean;
  allowWhiteLabel: boolean;
  defaultRedirectDelaySeconds: number;
  features: string[];
  isHighlighted: boolean;
  isVisible: boolean;
  ctaLabel: string;
  contactNote: string;
  sortOrder: number;
  updatedAt?: any;
}

export type RedirectValidationState =
  | { status: 'OK'; mode: RedirectMode; barcode: BarcodeRecord }
  | { status: 'CODE_NOT_FOUND'; message: string }
  | { status: 'ACCOUNT_SUSPENDED'; message: string }
  | { status: 'QR_CODE_DISABLED'; message: string }
  | { status: 'SCAN_LIMIT_REACHED'; message: string }
  | { status: 'INVALID_DESTINATION'; message: string };
