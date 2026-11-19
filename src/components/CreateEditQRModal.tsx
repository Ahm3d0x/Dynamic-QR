import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  FileText,
  Globe,
  Image as ImageIcon,
  Lock,
  MapPin,
  UserSquare2,
  Wifi,
  X,
} from 'lucide-react';
import {
  BarcodeRecord,
  ContentType,
  GeoEventData,
  RedirectMode,
  TextPromoData,
  UserProfile,
  VCardData,
  WifiData,
} from '../types/qr';
import {
  buildShortLinkUrl,
  clampRedirectDelay,
  enforcePlanFeatureConstraints,
  generateShortCode,
  parseGeoEvent,
  parseTextPromo,
  parseVCard,
  parseWifi,
  validateDestinationPayload,
} from '../utils/qrLogic';

interface CreateEditQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  existingBarcode?: BarcodeRecord | null;
  onSave: (payload: Omit<BarcodeRecord, 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const CONTENT_TYPES: {
  type: ContentType;
  label: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { type: 'URL', label: 'Website / URL', desc: 'Any website, store or page', icon: Globe },
  { type: 'TEXT', label: 'Text / Promo', desc: 'Share announcement or coupon', icon: FileText },
  { type: 'IMAGE', label: 'Image / Menu', desc: 'Show digital restaurant menu', icon: ImageIcon },
  { type: 'VCARD', label: 'VCARD', desc: 'Digital business contact card', icon: UserSquare2 },
  { type: 'WIFI', label: 'WiFi Network', desc: 'Instant guest Wi-Fi credentials', icon: Wifi },
  { type: 'GEO_EVENT', label: 'Geo Event', desc: 'Location pin on Google Maps', icon: MapPin },
];

const QR_COLOR_SWATCHES = [
  { label: 'Charcoal', hex: '#292824' },
  { label: 'Terracotta', hex: '#D97745' },
  { label: 'Forest Green', hex: '#233229' },
  { label: 'Espresso', hex: '#4A2C1D' },
  { label: 'Midnight Navy', hex: '#1E293B' },
];

export const CreateEditQRModal: React.FC<CreateEditQRModalProps> = ({
  isOpen,
  onClose,
  user,
  existingBarcode,
  onSave,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shortCode, setShortCode] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('URL');
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [textPromo, setTextPromo] = useState<TextPromoData>({
    headline: 'Special Offer! Get 20% OFF',
    body: 'Use this coupon code at checkout.',
    promoCode: 'QRD20',
  });
  const [vcard, setVcard] = useState<VCardData>({
    fullName: 'Ahmed Mohamed',
    jobTitle: 'Business Manager',
    company: 'QRDynamic',
    phone: '+20 123 456 7890',
    email: 'ahmed@company.com',
    website: 'https://qrdynamic.app',
  });
  const [wifi, setWifi] = useState<WifiData>({
    ssid: 'QRDynamic_WiFi',
    password: '12345678',
    encryption: 'WPA',
  });
  const [geo, setGeo] = useState<GeoEventData>({
    placeName: 'Flagship Branch',
    latitude: '30.0444',
    longitude: '31.2357',
    address: 'Downtown Cairo',
  });

  const [redirectMode, setRedirectMode] = useState<RedirectMode>('LANDING');
  const [redirectDelaySeconds, setRedirectDelaySeconds] = useState<number>(5);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome! Tap below to open your destination.');
  const [ctaText, setCtaText] = useState('Open Destination');
  const [qrColor, setQrColor] = useState('#292824');
  const [hideBranding, setHideBranding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const userDefaultDelay =
    typeof user.defaultRedirectDelaySeconds === 'number'
      ? clampRedirectDelay(user.defaultRedirectDelaySeconds)
      : user.allowDirectRedirect
      ? 2
      : 5;

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setErrorMsg('');
    if (existingBarcode) {
      setShortCode(existingBarcode.shortCode);
      setTitle(existingBarcode.title);
      setType(existingBarcode.type);
      setRedirectMode(existingBarcode.redirectMode);
      setRedirectDelaySeconds(
        typeof existingBarcode.redirectDelaySeconds === 'number'
          ? clampRedirectDelay(existingBarcode.redirectDelaySeconds)
          : existingBarcode.redirectMode === 'DIRECT'
          ? 0
          : userDefaultDelay
      );
      setWelcomeMessage(existingBarcode.welcomeMessage);
      setCtaText(existingBarcode.ctaText);
      setQrColor(existingBarcode.qrColor);
      setHideBranding(existingBarcode.hideBranding);

      if (existingBarcode.type === 'URL' || existingBarcode.type === 'IMAGE') {
        setUrlInput(existingBarcode.destination);
      } else if (existingBarcode.type === 'TEXT') {
        setTextPromo(parseTextPromo(existingBarcode.destination));
      } else if (existingBarcode.type === 'VCARD') {
        setVcard(parseVCard(existingBarcode.destination));
      } else if (existingBarcode.type === 'WIFI') {
        setWifi(parseWifi(existingBarcode.destination));
      } else if (existingBarcode.type === 'GEO_EVENT') {
        setGeo(parseGeoEvent(existingBarcode.destination));
      }
    } else {
      setShortCode(generateShortCode());
      setTitle('');
      setType('URL');
      setUrlInput('https://example.com');
      setRedirectMode(user.allowDirectRedirect ? 'DIRECT' : 'LANDING');
      setRedirectDelaySeconds(user.allowDirectRedirect ? userDefaultDelay : userDefaultDelay);
      setWelcomeMessage('Welcome! Discover our curated digital experience.');
      setCtaText('Open Website');
      setQrColor('#292824');
      setHideBranding(false);
    }
  }, [isOpen, existingBarcode, user, userDefaultDelay]);

  if (!isOpen) return null;

  const computeDestinationString = (): string => {
    switch (type) {
      case 'URL':
      case 'IMAGE':
        return urlInput.trim();
      case 'TEXT':
        return JSON.stringify(textPromo);
      case 'VCARD':
        return JSON.stringify(vcard);
      case 'WIFI':
        return JSON.stringify(wifi);
      case 'GEO_EVENT':
        return JSON.stringify(geo);
    }
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!title.trim()) {
        setErrorMsg('Please enter a campaign title for your QR code.');
        return;
      }
      const dest = computeDestinationString();
      if (!validateDestinationPayload(type, dest)) {
        setErrorMsg(
          type === 'URL' || type === 'IMAGE'
            ? 'Please enter a valid URL starting with https:// or http://'
            : 'Please complete the required fields for the selected content type.'
        );
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim()) {
      setErrorMsg('Campaign title is required.');
      return;
    }
    const destination = computeDestinationString();
    if (!validateDestinationPayload(type, destination)) {
      setErrorMsg('Destination details are invalid.');
      return;
    }

    const enforced = enforcePlanFeatureConstraints(
      user,
      redirectMode,
      hideBranding,
      redirectDelaySeconds
    );
    setSaving(true);
    try {
      await onSave({
        shortCode,
        ownerId: existingBarcode ? existingBarcode.ownerId : user.uid,
        ownerEmail: existingBarcode ? existingBarcode.ownerEmail : user.email,
        ownerStatus: existingBarcode ? existingBarcode.ownerStatus : user.status,
        title: title.trim().slice(0, 120),
        type,
        destination: destination.slice(0, 2000),
        redirectMode: enforced.redirectMode,
        redirectDelaySeconds: enforced.redirectDelaySeconds,
        welcomeMessage: (welcomeMessage.trim() || 'Welcome!').slice(0, 300),
        ctaText: (ctaText.trim() || 'Continue').slice(0, 80),
        qrColor,
        hideBranding: enforced.hideBranding,
        codeActive: existingBarcode ? existingBarcode.codeActive : true,
        isDeleted: false,
        scanCount: existingBarcode ? existingBarcode.scanCount : 0,
        maxScansLimit: existingBarcode ? existingBarcode.maxScansLimit : user.maxScansPerBarcode,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save QR code.');
    } finally {
      setSaving(false);
    }
  };

  const shortUrl = buildShortLinkUrl(shortCode);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-qr-modal-title"
    >
      <div className="bg-white border border-[#E6E0D6] rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#EFECE6]">
          <div>
            <h2 id="create-qr-modal-title" className="text-xl font-bold text-[#292824]">
              {existingBarcode ? `Edit QR Code (${existingBarcode.shortCode})` : 'Create New QR Code'}
            </h2>
            <p className="text-xs text-[#6E6A63] mt-0.5">
              Static printed short code <span className="font-mono font-semibold">{shortCode}</span> ·
              Change destination anytime without reprinting
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Create QR Modal"
            className="p-2 rounded-lg text-[#6E6A63] hover:text-[#292824] hover:bg-[#F8F5EF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Wizard Indicator matching concept mockup */}
        <div className="flex items-center justify-center gap-4 py-5 border-b border-[#EFECE6]">
          {[
            { num: 1, label: 'Content' },
            { num: 2, label: 'Customize' },
            { num: 3, label: 'Preview' },
          ].map((item, idx) => (
            <React.Fragment key={item.num}>
              <button
                type="button"
                onClick={() => {
                  if (item.num < step) setStep(item.num as 1 | 2 | 3);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                    step >= item.num
                      ? 'bg-[#D97745] text-white'
                      : 'bg-[#F8F5EF] text-[#6E6A63] border border-[#E6E0D6]'
                  }`}
                >
                  {item.num}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    step >= item.num ? 'text-[#292824]' : 'text-[#6E6A63]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
              {idx < 2 && <div className="w-12 md:w-20 h-px bg-[#E6E0D6]" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body Grid: Form Left + Live Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6 items-start">
          <div className="lg:col-span-8 space-y-5">
            {step === 1 && (
              <>
                {/* Campaign Name */}
                <div>
                  <label
                    htmlFor="qr-campaign-title"
                    className="block text-xs font-semibold text-[#292824] mb-1.5"
                  >
                    1. Campaign Name
                  </label>
                  <input
                    id="qr-campaign-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Summer Restaurant Menu, VIP Table Card, Store Wi-Fi"
                    className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm text-[#292824] focus:outline-none focus:border-[#D97745]"
                  />
                </div>

                {/* Choose Content Type (6 Dynamic Types) */}
                <div>
                  <span className="block text-xs font-semibold text-[#292824] mb-2">
                    2. Choose Content Type
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CONTENT_TYPES.map((ct) => {
                      const Icon = ct.icon;
                      const active = type === ct.type;
                      return (
                        <button
                          key={ct.type}
                          type="button"
                          onClick={() => {
                            setType(ct.type);
                            if (ct.type === 'IMAGE' && urlInput === 'https://example.com') {
                              setUrlInput(
                                'https://ais-dev-7yzva7cslq2ym37q45pmfx-325927501929.europe-west2.run.app/assets/aistudio/92faedbf-ecb7-4d54-81f0-d6a04a819e50_73a2ffa1.png'
                              );
                            }
                          }}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#FDF2EC] border-[#D97745] text-[#292824]'
                              : 'bg-[#F8F5EF] border-[#E6E0D6] text-[#292824] hover:border-[#D97745]/50'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              active ? 'bg-[#D97745] text-white' : 'bg-white text-[#D97745]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{ct.label}</span>
                            <span className="text-[11px] text-[#6E6A63] block truncate">
                              {ct.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Destination Fields by Content Type */}
                <div className="pt-2">
                  {(type === 'URL' || type === 'IMAGE') && (
                    <div>
                      <label
                        htmlFor="qr-destination-url"
                        className="block text-xs font-semibold text-[#292824] mb-1.5"
                      >
                        3. {type === 'URL' ? 'Enter Destination URL' : 'Enter Image or Digital Menu URL'}
                      </label>
                      <input
                        id="qr-destination-url"
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://yourwebsite.com/menu"
                        className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm text-[#292824] focus:outline-none focus:border-[#D97745]"
                      />
                    </div>
                  )}

                  {type === 'TEXT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="text-headline"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Offer / Announcement Headline
                        </label>
                        <input
                          id="text-headline"
                          type="text"
                          value={textPromo.headline}
                          onChange={(e) =>
                            setTextPromo({ ...textPromo, headline: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="text-body"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Announcement Body
                        </label>
                        <textarea
                          id="text-body"
                          rows={2}
                          value={textPromo.body}
                          onChange={(e) => setTextPromo({ ...textPromo, body: e.target.value })}
                          className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="text-promocode"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Coupon / Promo Code (Optional)
                        </label>
                        <input
                          id="text-promocode"
                          type="text"
                          value={textPromo.promoCode}
                          onChange={(e) =>
                            setTextPromo({ ...textPromo, promoCode: e.target.value })
                          }
                          placeholder="QRD20"
                          className="w-full px-3.5 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {type === 'VCARD' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="vcard-name"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Full Name
                        </label>
                        <input
                          id="vcard-name"
                          type="text"
                          value={vcard.fullName}
                          onChange={(e) => setVcard({ ...vcard, fullName: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="vcard-title"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Job Title
                        </label>
                        <input
                          id="vcard-title"
                          type="text"
                          value={vcard.jobTitle}
                          onChange={(e) => setVcard({ ...vcard, jobTitle: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="vcard-phone"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Phone Number
                        </label>
                        <input
                          id="vcard-phone"
                          type="text"
                          value={vcard.phone}
                          onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="vcard-email"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Email Address
                        </label>
                        <input
                          id="vcard-email"
                          type="email"
                          value={vcard.email}
                          onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {type === 'WIFI' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="wifi-ssid"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Network Name (SSID)
                        </label>
                        <input
                          id="wifi-ssid"
                          type="text"
                          value={wifi.ssid}
                          onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="wifi-password"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Password
                        </label>
                        <input
                          id="wifi-password"
                          type="text"
                          value={wifi.password}
                          onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="wifi-enc"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Security
                        </label>
                        <select
                          id="wifi-enc"
                          value={wifi.encryption}
                          onChange={(e) =>
                            setWifi({
                              ...wifi,
                              encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                            })
                          }
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        >
                          <option value="WPA">WPA / WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">Open (No Password)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {type === 'GEO_EVENT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="geo-place"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Place / Venue Name
                        </label>
                        <input
                          id="geo-place"
                          type="text"
                          value={geo.placeName}
                          onChange={(e) => setGeo({ ...geo, placeName: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="geo-lat"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Latitude
                        </label>
                        <input
                          id="geo-lat"
                          type="text"
                          value={geo.latitude}
                          onChange={(e) => setGeo({ ...geo, latitude: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="geo-lng"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Longitude
                        </label>
                        <input
                          id="geo-lng"
                          type="text"
                          value={geo.longitude}
                          onChange={(e) => setGeo({ ...geo, longitude: e.target.value })}
                          className="w-full px-3 py-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Redirect Mode Selection */}
                <div>
                  <span className="block text-xs font-semibold text-[#292824] mb-2">
                    4. Redirect Mode & Auto-Routing
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!user.allowDirectRedirect || type !== 'URL'}
                      onClick={() => {
                        setRedirectMode('DIRECT');
                        setRedirectDelaySeconds(0);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-colors ${
                        redirectMode === 'DIRECT' && user.allowDirectRedirect && type === 'URL'
                          ? 'bg-[#FDF2EC] border-[#D97745]'
                          : 'bg-[#F8F5EF] border-[#E6E0D6]'
                      } ${
                        !user.allowDirectRedirect || type !== 'URL'
                          ? 'opacity-60 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#292824]">Direct Auto-Redirect</span>
                        {!user.allowDirectRedirect && (
                          <span className="text-[11px] font-semibold text-[#D97745]">Pro Plan</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6E6A63] block mt-0.5">
                        Route straight to the URL automatically (0s instant or custom timer)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRedirectMode('LANDING');
                        if (user.allowDirectRedirect && redirectDelaySeconds === 0) {
                          setRedirectDelaySeconds(userDefaultDelay > 0 ? userDefaultDelay : 3);
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        redirectMode === 'LANDING' || !user.allowDirectRedirect || type !== 'URL'
                          ? 'bg-[#FDF2EC] border-[#D97745]'
                          : 'bg-[#F8F5EF] border-[#E6E0D6]'
                      }`}
                    >
                      <span className="text-xs font-bold text-[#292824] block">
                        Smart Landing Page
                      </span>
                      <span className="text-[11px] text-[#6E6A63] block mt-0.5">
                        Show branded card then auto-route to URL after countdown
                      </span>
                    </button>
                  </div>

                  {/* Auto-Redirect Timer Config (URL codes only) */}
                  {type === 'URL' && (
                    <div className="mt-3 p-3.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#292824]">
                          <Clock className="w-3.5 h-3.5 text-[#D97745]" />
                          <span>Auto-Redirect Timer</span>
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-[#D97745] tabular-nums">
                          {(!user.allowDirectRedirect ? userDefaultDelay : redirectDelaySeconds) === 0
                            ? 'Instant (0s)'
                            : `${!user.allowDirectRedirect ? userDefaultDelay : redirectDelaySeconds}s delay`}
                        </span>
                      </div>

                      {!user.allowDirectRedirect ? (
                        <div className="flex items-start gap-2 text-[11px] text-[#6E6A63]">
                          <Lock className="w-3.5 h-3.5 text-[#D97745] shrink-0 mt-0.5" />
                          <span>
                            Fixed at <strong className="text-[#292824]">{userDefaultDelay} seconds</strong> on
                            the {user.plan} plan. Visitors are automatically redirected without needing to
                            tap the button. Upgrade to customize delay or enable 0s instant routing.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[0, 2, 3, 5, 10].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setRedirectDelaySeconds(preset)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                                  redirectDelaySeconds === preset
                                    ? 'bg-[#D97745] text-white border-[#D97745]'
                                    : 'bg-white text-[#292824] border-[#E6E0D6] hover:border-[#D97745]'
                                }`}
                              >
                                {preset === 0 ? '0s Instant' : `${preset}s`}
                              </button>
                            ))}

                            <div className="flex items-center gap-1.5 ml-auto">
                              <label
                                htmlFor="qr-redirect-delay"
                                className="text-[11px] font-semibold text-[#6E6A63]"
                              >
                                Custom:
                              </label>
                              <input
                                id="qr-redirect-delay"
                                type="number"
                                min={0}
                                max={30}
                                value={redirectDelaySeconds}
                                onChange={(e) =>
                                  setRedirectDelaySeconds(clampRedirectDelay(Number(e.target.value)))
                                }
                                className="w-16 px-2 py-1 bg-white border border-[#E6E0D6] rounded-lg text-xs font-mono text-center text-[#292824] tabular-nums focus:outline-none focus:border-[#D97745]"
                              />
                              <span className="text-[11px] text-[#6E6A63]">sec</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#6E6A63]">
                            {redirectDelaySeconds === 0
                              ? 'Visitors are routed automatically the moment scan verification completes.'
                              : `Visitors see your branded card and automatically redirect after ${redirectDelaySeconds} seconds.`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="qr-welcome-msg"
                    className="block text-xs font-semibold text-[#292824] mb-1.5"
                  >
                    5. Smart Landing Welcome Message
                  </label>
                  <input
                    id="qr-welcome-msg"
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome to Our Restaurant! Discover our delicious menu"
                    className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="qr-cta-text"
                    className="block text-xs font-semibold text-[#292824] mb-1.5"
                  >
                    6. Action Button (CTA) Label
                  </label>
                  <input
                    id="qr-cta-text"
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="View Menu →"
                    className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#292824] mb-2">
                    7. QR Pattern Color
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {QR_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setQrColor(swatch.hex)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          qrColor === swatch.hex
                            ? 'bg-[#FDF2EC] border-[#D97745] text-[#292824]'
                            : 'bg-[#F8F5EF] border-[#E6E0D6] text-[#6E6A63]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span>{swatch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8F5EF] border border-[#E6E0D6] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#292824] block">
                      8. White-Label (Hide QRDynamic Branding)
                    </span>
                    <span className="text-[11px] text-[#6E6A63]">
                      {user.allowWhiteLabel
                        ? 'Remove "Powered by QRDynamic" footer on Smart Landing pages'
                        : 'Upgrade to Pro or Enterprise to unlock White-Label branding'}
                    </span>
                  </div>
                  <input
                    id="qr-whitelabel-toggle"
                    type="checkbox"
                    disabled={!user.allowWhiteLabel}
                    checked={user.allowWhiteLabel && hideBranding}
                    onChange={(e) => setHideBranding(e.target.checked)}
                    aria-label="Hide platform logo"
                    className="w-5 h-5 accent-[#D97745] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#292824]">
                  Ready to Save Dynamic QR Campaign
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#E6E0D6]">
                    <span className="text-[#6E6A63] block">Campaign Title</span>
                    <span className="font-bold text-[#292824]">{title}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E6E0D6]">
                    <span className="text-[#6E6A63] block">Permanent Short Code</span>
                    <span className="font-mono font-bold text-[#D97745]">{shortCode}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E6E0D6]">
                    <span className="text-[#6E6A63] block">Content Type & Mode</span>
                    <span className="font-bold text-[#292824]">
                      {type} · {redirectMode}
                      {type === 'URL'
                        ? ` · ${
                            (!user.allowDirectRedirect ? userDefaultDelay : redirectDelaySeconds) === 0
                              ? 'Instant'
                              : `Auto ${
                                  !user.allowDirectRedirect ? userDefaultDelay : redirectDelaySeconds
                                }s`
                          }`
                        : ''}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E6E0D6]">
                    <span className="text-[#6E6A63] block">Scan Quota Limit</span>
                    <span className="font-mono font-bold text-[#292824] tabular-nums">
                      {user.maxScansPerBarcode.toLocaleString()} scans
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}
          </div>

          {/* 9. Live Preview Column */}
          <div className="lg:col-span-4 bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-5 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-[#292824] mb-3">9. Live Preview</span>
            <div className="bg-white p-4 rounded-2xl border border-[#E6E0D6] shadow-2xs mb-3">
              <QRCodeSVG
                value={shortUrl}
                size={156}
                fgColor={qrColor}
                bgColor="#FFFFFF"
                level="H"
              />
            </div>
            <span className="text-xs font-mono font-bold text-[#292824]">{shortCode}</span>
            <span className="text-[11px] text-[#6E6A63] mt-0.5 truncate max-w-full">
              {title || 'Untitled Campaign'}
            </span>
            <div className="w-full mt-4 pt-3 border-t border-[#E6E0D6] text-left space-y-1.5 text-[11px] text-[#6E6A63]">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-semibold text-[#292824]">{type}</span>
              </div>
              <div className="flex justify-between">
                <span>Routing:</span>
                <span className="font-semibold text-[#292824]">{redirectMode}</span>
              </div>
              {type === 'URL' && (
                <div className="flex justify-between">
                  <span>Auto-Route:</span>
                  <span className="font-mono font-semibold text-[#2E6B3E] tabular-nums">
                    {(!user.allowDirectRedirect ? userDefaultDelay : redirectDelaySeconds) === 0
                      ? 'Instant (0s)'
                      : `${!user.allowDirectRedirect ? userDefaultDelay : redirectDelaySeconds}s`}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CTA Button:</span>
                <span className="font-semibold text-[#D97745] truncate max-w-[130px]">
                  {ctaText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-5 border-t border-[#EFECE6]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] text-xs font-semibold rounded-xl border border-[#E6E0D6] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#6E6A63] text-xs font-semibold rounded-xl border border-[#E6E0D6] cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinalSave}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : '10. Save Dynamic QR'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
