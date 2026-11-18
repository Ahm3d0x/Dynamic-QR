import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsUrl,
  buildShortLinkUrl,
  canUserCreateBarcode,
  enforcePlanFeatureConstraints,
  evaluateSmartRedirect,
  formatVCardDownloadString,
  generateShortCode,
  getPlanDefaults,
  normalizeShortCodeInput,
  validateDestinationPayload,
} from './qrLogic';
import { BarcodeRecord } from '../types/qr';

const mockActiveBarcode: BarcodeRecord = {
  shortCode: 'QRD-8F3K9A',
  ownerId: 'user-123',
  ownerEmail: 'ahmed@company.com',
  ownerStatus: 'ACTIVE',
  title: 'Restaurant Menu',
  type: 'URL',
  destination: 'https://toque.menu/cairo-bistro',
  redirectMode: 'DIRECT',
  welcomeMessage: 'Welcome to Our Restaurant!',
  ctaText: 'View Menu',
  qrColor: '#292824',
  hideBranding: false,
  codeActive: true,
  isDeleted: false,
  scanCount: 42,
  maxScansLimit: 500,
};

test('generateShortCode produces valid QRD-XXXXXX identifier', () => {
  const code = generateShortCode();
  assert.match(code, /^QRD-[A-Z0-9]{6}$/);
  assert.equal(generateShortCode('8F3K9A'), 'QRD-8F3K9A');
});

test('normalizeShortCodeInput extracts shortCode from raw strings and URLs', () => {
  assert.equal(normalizeShortCodeInput('qrd-8f3k9a'), 'QRD-8F3K9A');
  assert.equal(normalizeShortCodeInput('8f3k9a'), 'QRD-8F3K9A');
  assert.equal(normalizeShortCodeInput('https://domain.com/r/QRD-8F3K9A'), 'QRD-8F3K9A');
});

test('buildShortLinkUrl uses /r/ path architecture', () => {
  assert.equal(
    buildShortLinkUrl('QRD-8F3K9A', 'https://qrdynamic.io/'),
    'https://qrdynamic.io/r/QRD-8F3K9A'
  );
});

test('getPlanDefaults returns accurate tier quotas', () => {
  const free = getPlanDefaults('FREE');
  assert.equal(free.maxBarcodes, 5);
  assert.equal(free.maxScansPerBarcode, 500);
  assert.equal(free.allowDirectRedirect, false);

  const pro = getPlanDefaults('PRO');
  assert.equal(pro.maxBarcodes, 50);
  assert.equal(pro.maxScansPerBarcode, 10000);
  assert.equal(pro.allowDirectRedirect, true);
});

test('canUserCreateBarcode blocks suspended users and quota overflow', () => {
  assert.equal(
    canUserCreateBarcode({ status: 'ACTIVE', maxBarcodes: 5 }, 4).allowed,
    true
  );
  assert.equal(
    canUserCreateBarcode({ status: 'ACTIVE', maxBarcodes: 5 }, 5).allowed,
    false
  );
  assert.equal(
    canUserCreateBarcode({ status: 'SUSPENDED', maxBarcodes: 50 }, 1).allowed,
    false
  );
});

test('enforcePlanFeatureConstraints restricts DIRECT and White-Label on FREE plan', () => {
  const constrained = enforcePlanFeatureConstraints(
    { allowDirectRedirect: false, allowWhiteLabel: false },
    'DIRECT',
    true
  );
  assert.equal(constrained.redirectMode, 'LANDING');
  assert.equal(constrained.hideBranding, false);
});

test('evaluateSmartRedirect handles all 5 error states and valid DIRECT/LANDING modes', () => {
  // 1. Not found or soft deleted
  assert.equal(evaluateSmartRedirect(null).status, 'CODE_NOT_FOUND');
  assert.equal(
    evaluateSmartRedirect({ ...mockActiveBarcode, isDeleted: true }).status,
    'CODE_NOT_FOUND'
  );

  // 2. Owner account suspended
  assert.equal(
    evaluateSmartRedirect({ ...mockActiveBarcode, ownerStatus: 'SUSPENDED' }).status,
    'ACCOUNT_SUSPENDED'
  );

  // 3. QR code paused/disabled
  assert.equal(
    evaluateSmartRedirect({ ...mockActiveBarcode, codeActive: false }).status,
    'QR_CODE_DISABLED'
  );

  // 4. Scan limit reached
  assert.equal(
    evaluateSmartRedirect({ ...mockActiveBarcode, scanCount: 500, maxScansLimit: 500 }).status,
    'SCAN_LIMIT_REACHED'
  );

  // 5. Invalid destination
  assert.equal(
    evaluateSmartRedirect({ ...mockActiveBarcode, destination: 'not-a-valid-url' }).status,
    'INVALID_DESTINATION'
  );

  // 6. Valid DIRECT redirect for URL
  const okDirect = evaluateSmartRedirect(mockActiveBarcode);
  assert.equal(okDirect.status, 'OK');
  if (okDirect.status === 'OK') {
    assert.equal(okDirect.mode, 'DIRECT');
  }

  // 7. Rich content types (WIFI) always render LANDING page even if DIRECT was requested
  const okWifi = evaluateSmartRedirect({
    ...mockActiveBarcode,
    type: 'WIFI',
    destination: JSON.stringify({ ssid: 'QRDynamic_WiFi', password: '12345678', encryption: 'WPA' }),
  });
  assert.equal(okWifi.status, 'OK');
  if (okWifi.status === 'OK') {
    assert.equal(okWifi.mode, 'LANDING');
  }
});

test('validateDestinationPayload and helper formatters work accurately', () => {
  assert.equal(validateDestinationPayload('URL', 'https://example.com'), true);
  assert.equal(validateDestinationPayload('URL', 'javascript:alert(1)'), false);
  assert.equal(
    validateDestinationPayload(
      'IMAGE',
      '/assets/aistudio/92faedbf-ecb7-4d54-81f0-d6a04a819e50_73a2ffa1.png'
    ),
    true
  );

  const vcardStr = formatVCardDownloadString({
    fullName: 'Ahmed Mohamed',
    jobTitle: 'Business Manager',
    company: 'QRDynamic',
    phone: '+20 123 456 7890',
    email: 'ahmed@company.com',
    website: 'https://qrdynamic.app',
  });
  assert.ok(vcardStr.includes('FN:Ahmed Mohamed'));
  assert.ok(vcardStr.includes('TEL;TYPE=CELL:+20 123 456 7890'));

  const mapsUrl = buildGoogleMapsUrl({
    placeName: 'Cairo Tower',
    latitude: '30.0459',
    longitude: '31.2243',
    address: 'Zamalek, Cairo',
  });
  assert.ok(mapsUrl.includes('30.0459%2C31.2243'));
});
