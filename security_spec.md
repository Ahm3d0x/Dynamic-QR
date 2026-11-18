# Security Specification (`security_spec.md`) — QRDynamic

## 1. Data Invariants

1. **User Identity & Privilege Escalation Guard**:
   - A user document `/users/{userId}` can only be created by the authenticated user where `userId == request.auth.uid` and `incoming().uid == request.auth.uid`.
   - Standard users registering an account MUST default to `role == 'ADMIN'`, `plan == 'FREE'`, `maxBarcodes == 5`, `maxScansPerBarcode == 500`, `allowDirectRedirect == false`, `allowWhiteLabel == false`, unless the user is the bootstrapped Super Admin (`ah2005211@gmail.com` with `email_verified == true`).
   - Standard users CANNOT update `role`, `plan`, `status`, `maxBarcodes`, `maxScansPerBarcode`, `allowDirectRedirect`, or `allowWhiteLabel` on their own user profile. Only a verified Super Admin can modify these quota and RBAC fields.
   - PII Isolation: Reading `/users/{userId}` is restricted strictly to `isOwner(userId)` or `isSuperAdmin()`. Blanket `isSignedIn()` reads on `/users` are strictly prohibited.

2. **Barcode Ownership & Immutable ShortCode**:
   - Every `/barcodes/{barcodeId}` document must have `shortCode == barcodeId` and `ownerId == request.auth.uid` upon creation, and the creator's `/users/$(request.auth.uid)` profile must exist and have `status == 'ACTIVE'`.
   - `shortCode`, `ownerId`, and `createdAt` are strictly immutable during updates.
   - Only the barcode's `ownerId` or `isSuperAdmin()` can update configuration fields (`title`, `type`, `destination`, `redirectMode`, `welcomeMessage`, `ctaText`, `qrColor`, `hideBranding`, `codeActive`, `isDeleted`, `updatedAt`).
   - Visitors scanning a QR code can perform an atomic scan counter increment ONLY if the barcode is active (`existing().codeActive == true`), not deleted (`existing().isDeleted == false`), the owner is active (`existing().ownerStatus == 'ACTIVE'`), `incoming().scanCount == existing().scanCount + 1`, `incoming().scanCount <= existing().maxScansLimit`, and ONLY `['scanCount', 'updatedAt']` are modified.

3. **ScanLog Integrity**:
   - Any visitor recording a scan log `/scanLogs/{scanId}` must reference an existing barcode `/barcodes/$(incoming().barcodeId)` and enforce exact schema keys, string length boundaries, and server timestamp (`incoming().timestamp == request.time`).
   - Listing or reading `/scanLogs/{scanId}` is restricted strictly to the barcode owner (`resource.data.ownerId == request.auth.uid`) or `isSuperAdmin()`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Self-Assigned Super Admin on Signup)**: Authenticated user tries to create `/users/{uid}` with `role: "SUPER_ADMIN"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Self-Upgraded Quota on Update)**: Authenticated user tries to update their `/users/{uid}` with `plan: "ENTERPRISE", maxBarcodes: 10000`. -> `PERMISSION_DENIED`
3. **Payload 3 (PII Harvesting on Users Collection)**: Authenticated user `userA` tries to `get` or `list` `/users/userB`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection on User)**: Authenticated user sends an extra key `isVerifiedAdmin: true` to `/users/{uid}`. -> `PERMISSION_DENIED`
5. **Payload 5 (Orphaned / Spoofed Owner Barcode Creation)**: User `userA` tries to create `/barcodes/QRD-123456` with `ownerId: "userB"`. -> `PERMISSION_DENIED`
6. **Payload 6 (Denial-of-Wallet 10KB Destination String)**: User tries to create `/barcodes/QRD-123456` with a 10,000-character `destination` string (exceeding `maxLength: 2000`). -> `PERMISSION_DENIED`
7. **Payload 7 (Barcode Owner Transfer Attack)**: User tries to update `ownerId` or `shortCode` on an existing `/barcodes/QRD-123456`. -> `PERMISSION_DENIED`
8. **Payload 8 (Scan CounterTampering / Reset by Visitor)**: Visitor tries to update `scanCount` by +50 or reset `scanCount: 0` or change `destination` without owning the barcode. -> `PERMISSION_DENIED`
9. **Payload 9 (Scan Beyond Max Limit)**: Visitor tries to increment `scanCount` when `existing().scanCount >= existing().maxScansLimit` or `existing().codeActive == false`. -> `PERMISSION_DENIED`
10. **Payload 10 (Client Timestamp Forgery)**: User tries to create a barcode with a forged past/future `createdAt` instead of `request.time`. -> `PERMISSION_DENIED`
11. **Payload 11 (Unverified Email Spoof Attack)**: Attacker with unverified email `ah2005211@gmail.com` (`email_verified: false`) attempts Super Admin operations. -> `PERMISSION_DENIED`
12. **Payload 12 (Cross-Tenant ScanLog Scraping)**: Authenticated user `userA` attempts a blanket `list` query on `/scanLogs` without filtering `ownerId == request.auth.uid`. -> `PERMISSION_DENIED`
