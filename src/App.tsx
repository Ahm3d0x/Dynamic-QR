/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  AccountStatus,
  BarcodeRecord,
  PlanType,
  ScanLogRecord,
  SubscriptionPlanConfig,
  SuperAdminInviteRecord,
  UserProfile,
  UserRole,
} from './types/qr';
import {
  DEMO_ADMIN_USER,
  INITIAL_DEMO_BARCODES,
  INITIAL_DEMO_SCAN_LOGS,
  INITIAL_DEMO_USERS,
} from './utils/demoData';
import {
  getPlanDefaults,
  normalizeShortCodeInput,
  PLAN_CATALOG,
  sanitizeSubscriptionPlan,
} from './utils/qrLogic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicHomeView } from './components/PublicHomeView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { SuperAdminView } from './components/SuperAdminView';
import { SmartRedirectView } from './components/SmartRedirectView';
import { CreateEditQRModal } from './components/CreateEditQRModal';
import { PrintStudioModal } from './components/PrintStudioModal';
import { ScannerModal } from './components/ScannerModal';
import { PlanManagerModal } from './components/PlanManagerModal';
import { EditPlanModal } from './components/EditPlanModal';
import { OfflineIndicator } from './components/OfflineIndicator';

type ViewMode = 'HOME' | 'ADMIN' | 'SUPER_ADMIN' | 'REDIRECT';

const PRIMARY_SUPER_ADMIN_EMAIL = 'ah2005211@gmail.com';
const SESSION_PROFILE_KEY = 'dynamicqr_session_profile_v1';
const LAST_VIEW_KEY = 'dynamicqr_last_view_v1';
const REDIRECT_PENDING_KEY = 'dynamicqr_auth_redirect_pending_v1';
const REDIRECT_PENDING_TTL_MS = 2 * 60 * 1000;

function readCachedProfile(): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(SESSION_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed && typeof parsed.uid === 'string' && parsed.uid && !parsed.uid.startsWith('demo-')) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCachedProfile(profile: UserProfile): void {
  try {
    window.localStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota / private mode restrictions
  }
}

function clearCachedSession(): void {
  try {
    window.localStorage.removeItem(SESSION_PROFILE_KEY);
    window.localStorage.removeItem(LAST_VIEW_KEY);
    window.localStorage.removeItem(REDIRECT_PENDING_KEY);
  } catch {
    // Ignore
  }
}

function readLastWorkspaceView(): 'ADMIN' | 'SUPER_ADMIN' | null {
  try {
    const raw = window.localStorage.getItem(LAST_VIEW_KEY);
    if (raw === 'ADMIN' || raw === 'SUPER_ADMIN') return raw;
    return null;
  } catch {
    return null;
  }
}

function saveLastWorkspaceView(view: 'ADMIN' | 'SUPER_ADMIN'): void {
  try {
    window.localStorage.setItem(LAST_VIEW_KEY, view);
  } catch {
    // Ignore
  }
}

function hasPendingRedirectFlag(): boolean {
  try {
    const raw = window.localStorage.getItem(REDIRECT_PENDING_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts) || Date.now() - ts > REDIRECT_PENDING_TTL_MS) {
      window.localStorage.removeItem(REDIRECT_PENDING_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setPendingRedirectFlag(): void {
  try {
    window.localStorage.setItem(REDIRECT_PENDING_KEY, String(Date.now()));
  } catch {
    // Ignore
  }
}

function clearPendingRedirectFlag(): void {
  try {
    window.localStorage.removeItem(REDIRECT_PENDING_KEY);
  } catch {
    // Ignore
  }
}

function buildBaselineUserProfile(
  fbUser: FirebaseUser,
  cached: UserProfile | null
): UserProfile {
  const normalizedEmail = (fbUser.email || '').trim().toLowerCase();
  const isPrimarySuperAdmin = normalizedEmail === PRIMARY_SUPER_ADMIN_EMAIL;

  if (cached && cached.uid === fbUser.uid) {
    return {
      ...cached,
      role: isPrimarySuperAdmin ? 'SUPER_ADMIN' : cached.role,
    };
  }

  const defaultTier = getPlanDefaults(isPrimarySuperAdmin ? 'ENTERPRISE' : 'FREE');
  return {
    uid: fbUser.uid,
    name: (fbUser.displayName || 'Dynamic QR User').slice(0, 100),
    email: (fbUser.email || 'user@dynamicqr.app').slice(0, 200),
    role: isPrimarySuperAdmin ? 'SUPER_ADMIN' : 'ADMIN',
    status: 'ACTIVE',
    plan: defaultTier.plan,
    maxBarcodes: defaultTier.maxBarcodes,
    maxScansPerBarcode: defaultTier.maxScansPerBarcode,
    allowDirectRedirect: defaultTier.allowDirectRedirect,
    allowWhiteLabel: defaultTier.allowWhiteLabel,
    defaultRedirectDelaySeconds: defaultTier.defaultRedirectDelaySeconds,
  };
}

function emailToInviteDocId(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
}

function getInitialRoute(): { viewMode: ViewMode; shortCode: string } {
  if (typeof window === 'undefined') {
    return { viewMode: 'HOME', shortCode: '' };
  }
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const rMatch = path.match(/^\/r\/([A-Za-z0-9_-]+)/);

  if (rMatch && rMatch[1]) {
    return { viewMode: 'REDIRECT', shortCode: normalizeShortCodeInput(rMatch[1]) };
  }

  const queryCode = params.get('r') || params.get('id');
  if (queryCode) {
    return { viewMode: 'REDIRECT', shortCode: normalizeShortCodeInput(queryCode) };
  }

  if (params.get('autostart') === '1') {
    return { viewMode: 'ADMIN', shortCode: '' };
  }

  return { viewMode: 'HOME', shortCode: '' };
}

export default function App() {
  const initialRoute = getInitialRoute();
  const initialCachedProfile =
    typeof window !== 'undefined' && initialRoute.viewMode === 'HOME'
      ? readCachedProfile()
      : null;
  const initialPendingRedirect =
    typeof window !== 'undefined' && initialRoute.viewMode === 'HOME'
      ? hasPendingRedirectFlag()
      : false;

  const initialResolvedView: ViewMode = (() => {
    if (initialRoute.viewMode !== 'HOME') return initialRoute.viewMode;
    if (initialCachedProfile) {
      const savedView = readLastWorkspaceView();
      if (initialCachedProfile.role === 'SUPER_ADMIN') {
        return savedView === 'ADMIN' ? 'ADMIN' : 'SUPER_ADMIN';
      }
      return 'ADMIN';
    }
    return 'HOME';
  })();

  const [viewMode, setViewMode] = useState<ViewMode>(initialResolvedView);
  const viewModeRef = useRef<ViewMode>(initialResolvedView);
  const [activeShortCode, setActiveShortCode] = useState<string>(initialRoute.shortCode);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const isFirebaseAuthed = Boolean(firebaseUid);
  const [isCompletingRedirect, setIsCompletingRedirect] = useState<boolean>(initialPendingRedirect);
  const [globalAuthError, setGlobalAuthError] = useState<string>('');

  // Keep live viewMode ref synced & persist workspace selection for seamless refreshes
  useEffect(() => {
    viewModeRef.current = viewMode;
    if (firebaseUid && (viewMode === 'ADMIN' || viewMode === 'SUPER_ADMIN')) {
      saveLastWorkspaceView(viewMode);
    }
  }, [viewMode, firebaseUid]);

  // State for users, barcodes, scanLogs, invites
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    initialCachedProfile || DEMO_ADMIN_USER
  );
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_DEMO_USERS);
  const [barcodes, setBarcodes] = useState<BarcodeRecord[]>(INITIAL_DEMO_BARCODES);
  const [scanLogs, setScanLogs] = useState<ScanLogRecord[]>(INITIAL_DEMO_SCAN_LOGS);
  const [invites, setInvites] = useState<SuperAdminInviteRecord[]>([]);
  const [planCatalog, setPlanCatalog] =
    useState<Record<PlanType, SubscriptionPlanConfig>>(PLAN_CATALOG);
  const [remoteRedirectBarcode, setRemoteRedirectBarcode] = useState<BarcodeRecord | null>(null);
  const [remoteResolvedCode, setRemoteResolvedCode] = useState<string | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState<BarcodeRecord | null>(null);
  const [printingBarcode, setPrintingBarcode] = useState<BarcodeRecord | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [managingSubscriber, setManagingSubscriber] = useState<UserProfile | null>(null);
  const [editingPlanConfig, setEditingPlanConfig] = useState<SubscriptionPlanConfig | null>(null);

  // Real-time listener for public subscriptionPlans catalog (updated by Super Admin)
  useEffect(() => {
    const unsubPlans = onSnapshot(
      collection(db, 'subscriptionPlans'),
      (snapshot) => {
        if (snapshot.empty) return;
        setPlanCatalog((prev) => {
          const next: Record<PlanType, SubscriptionPlanConfig> = { ...prev };
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SubscriptionPlanConfig;
            if (
              data &&
              (data.plan === 'FREE' ||
                data.plan === 'PRO' ||
                data.plan === 'ENTERPRISE' ||
                data.plan === 'CUSTOM')
            ) {
              next[data.plan] = {
                ...PLAN_CATALOG[data.plan],
                ...data,
                features: Array.isArray(data.features)
                  ? data.features
                  : PLAN_CATALOG[data.plan].features,
              };
            }
          });
          return next;
        });
      },
      () => {
        // Fallback smoothly to default PLAN_CATALOG if offline
      }
    );

    return () => unsubPlans();
  }, []);

  // Keep state in sync on browser Back/Forward navigation
  useEffect(() => {
    const handleRouteSync = () => {
      const next = getInitialRoute();
      setActiveShortCode(next.shortCode);
      if (next.viewMode === 'REDIRECT') {
        setViewMode('REDIRECT');
      } else if (auth.currentUser) {
        const cached = readCachedProfile();
        const savedView = readLastWorkspaceView();
        const isSuper = cached?.role === 'SUPER_ADMIN';
        setViewMode(isSuper && savedView !== 'ADMIN' ? 'SUPER_ADMIN' : 'ADMIN');
      } else {
        setViewMode(next.viewMode);
      }
    };

    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, []);

  // Unified Firebase Auth session restoration + Redirect result handling + Auto Role Routing
  useEffect(() => {
    let active = true;
    let authInitialized = false;
    const wasRedirectPending = hasPendingRedirectFlag();

    const applyAuthenticatedUser = async (fbUser: FirebaseUser) => {
      if (!active) return;

      clearPendingRedirectFlag();
      setIsCompletingRedirect(false);
      setGlobalAuthError('');
      setFirebaseUid(fbUser.uid);

      const normalizedEmail = (fbUser.email || '').trim().toLowerCase();
      const isPrimarySuperAdmin = normalizedEmail === PRIMARY_SUPER_ADMIN_EMAIL;
      const cached = readCachedProfile();
      const baselineProfile = buildBaselineUserProfile(fbUser, cached);

      // 1. Immediately hydrate UI & route into workspace so refresh NEVER flashes HOME or blocks on slow network
      setCurrentUser(baselineProfile);
      saveCachedProfile(baselineProfile);

      if (viewModeRef.current === 'HOME') {
        const savedView = readLastWorkspaceView();
        if (baselineProfile.role === 'SUPER_ADMIN') {
          setViewMode(savedView === 'ADMIN' ? 'ADMIN' : 'SUPER_ADMIN');
        } else {
          setViewMode('ADMIN');
        }
      }

      // 2. Synchronize authoritative profile document with Firestore in the background
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userRef);
        if (!active) return;

        if (!snap.exists()) {
          const defaultTier = getPlanDefaults(isPrimarySuperAdmin ? 'ENTERPRISE' : 'FREE');
          let assignedRole: UserRole = isPrimarySuperAdmin ? 'SUPER_ADMIN' : 'ADMIN';
          let assignedPlan: PlanType = defaultTier.plan;

          const newProfile: UserProfile = {
            uid: fbUser.uid,
            name: (fbUser.displayName || 'Dynamic QR User').slice(0, 100),
            email: (fbUser.email || 'user@dynamicqr.app').slice(0, 200),
            role: assignedRole,
            status: 'ACTIVE',
            plan: assignedPlan,
            maxBarcodes: defaultTier.maxBarcodes,
            maxScansPerBarcode: defaultTier.maxScansPerBarcode,
            allowDirectRedirect: defaultTier.allowDirectRedirect,
            allowWhiteLabel: defaultTier.allowWhiteLabel,
            defaultRedirectDelaySeconds: defaultTier.defaultRedirectDelaySeconds,
          };

          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (!isPrimarySuperAdmin && normalizedEmail) {
            try {
              const invId = emailToInviteDocId(normalizedEmail);
              const invSnap = await getDoc(doc(db, 'superAdminInvites', invId));
              if (invSnap.exists()) {
                const invData = invSnap.data() as SuperAdminInviteRecord;
                assignedRole = invData.role;
                assignedPlan = invData.plan;
              }
            } catch {
              // Ignore invite lookup if none exists
            }
          }

          const finalNewProfile: UserProfile = {
            ...newProfile,
            role: assignedRole,
            plan: assignedPlan,
          };
          if (!active) return;
          setCurrentUser(finalNewProfile);
          saveCachedProfile(finalNewProfile);
          if (viewModeRef.current === 'HOME') {
            setViewMode(assignedRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN');
          }
        } else {
          const data = snap.data() as UserProfile;
          const effectiveRole: UserRole = isPrimarySuperAdmin ? 'SUPER_ADMIN' : data.role;
          const syncedProfile: UserProfile = { ...data, role: effectiveRole };
          setCurrentUser(syncedProfile);
          saveCachedProfile(syncedProfile);

          if (viewModeRef.current === 'HOME') {
            const savedView = readLastWorkspaceView();
            setViewMode(
              effectiveRole === 'SUPER_ADMIN' && savedView !== 'ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'
            );
          } else if (viewModeRef.current === 'SUPER_ADMIN' && effectiveRole !== 'SUPER_ADMIN') {
            setViewMode('ADMIN');
          }
        }
      } catch (err) {
        // Keep the authenticated session active on transient/offline Firestore errors instead of logging the user out
        console.warn('Background profile sync deferred:', err);
      }
    };

    // Wait for both persisted session restoration AND any OAuth redirect result before deciding user is signed out
    const initPromise = (async () => {
      try {
        const redirectRes = await getRedirectResult(auth);
        if (redirectRes?.user && active) {
          await applyAuthenticatedUser(redirectRes.user);
        }
      } catch (err: any) {
        if (active && wasRedirectPending) {
          setGlobalAuthError(
            err?.message ||
              'Google sign-in could not complete after redirect. Please try again and allow popups.'
          );
        }
      }

      try {
        await auth.authStateReady();
      } catch {
        // Ignore if authStateReady not available
      }

      if (!active) return;
      authInitialized = true;

      if (auth.currentUser) {
        await applyAuthenticatedUser(auth.currentUser);
      } else {
        if (wasRedirectPending) {
          setGlobalAuthError(
            'Your browser blocked cross-site sign-in cookies during redirect. Please click Continue with Google again and allow the Google sign-in popup.'
          );
        }
        clearPendingRedirectFlag();
        setIsCompletingRedirect(false);
        clearCachedSession();
        setFirebaseUid(null);
        if (viewModeRef.current !== 'REDIRECT') {
          setViewMode('HOME');
        }
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!active) return;
      if (fbUser) {
        void applyAuthenticatedUser(fbUser);
      } else if (authInitialized) {
        clearCachedSession();
        setFirebaseUid(null);
        if (viewModeRef.current !== 'REDIRECT') {
          setViewMode('HOME');
        }
      }
    });

    void initPromise;

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Firestore real-time listeners when authenticated with Firebase
  useEffect(() => {
    if (!firebaseUid || !auth.currentUser) return;

    const uid = firebaseUid;
    const isSuper = currentUser.role === 'SUPER_ADMIN';

    const barcodesQuery = isSuper
      ? collection(db, 'barcodes')
      : query(collection(db, 'barcodes'), where('ownerId', '==', uid));

    const unsubBarcodes = onSnapshot(
      barcodesQuery,
      (snapshot) => {
        const list: BarcodeRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as BarcodeRecord);
        });
        if (list.length > 0) {
          setBarcodes(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'barcodes');
      }
    );

    const logsQuery = isSuper
      ? collection(db, 'scanLogs')
      : query(collection(db, 'scanLogs'), where('ownerId', '==', uid));

    const unsubLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const list: ScanLogRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ScanLogRecord, 'id'>) });
        });
        if (list.length > 0) {
          setScanLogs(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'scanLogs');
      }
    );

    let unsubUsers: (() => void) | undefined;
    let unsubInvites: (() => void) | undefined;

    if (isSuper) {
      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const list: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as UserProfile);
          });
          if (list.length > 0) {
            setUsers(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      );

      unsubInvites = onSnapshot(
        collection(db, 'superAdminInvites'),
        (snapshot) => {
          const list: SuperAdminInviteRecord[] = [];
          snapshot.forEach((docSnap) => {
            list.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<SuperAdminInviteRecord, 'id'>),
            });
          });
          setInvites(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'superAdminInvites');
        }
      );
    }

    const unsubCurrentUser = onSnapshot(
      doc(db, 'users', uid),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data() as UserProfile;
        const normalizedEmail = (auth.currentUser?.email || data.email || '').trim().toLowerCase();
        const effectiveRole: UserRole =
          normalizedEmail === PRIMARY_SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : data.role;
        const nextProfile: UserProfile = { ...data, role: effectiveRole };
        setCurrentUser(nextProfile);
        saveCachedProfile(nextProfile);
      },
      () => {
        // Non-fatal if offline
      }
    );

    return () => {
      unsubCurrentUser();
      unsubBarcodes();
      unsubLogs();
      if (unsubUsers) unsubUsers();
      if (unsubInvites) unsubInvites();
    };
  }, [firebaseUid, currentUser.role]);

  // Fetch single barcode from Firestore if visitor opens /r/SHORTCODE not in local cache
  useEffect(() => {
    if (viewMode !== 'REDIRECT' || !activeShortCode) return;
    const localFound = barcodes.find((b) => b.shortCode === activeShortCode);
    if (localFound) {
      setRemoteRedirectBarcode(null);
      setRemoteResolvedCode(activeShortCode);
      return;
    }

    let cancelled = false;
    async function fetchRemoteCode() {
      try {
        const docSnap = await getDoc(doc(db, 'barcodes', activeShortCode));
        if (!cancelled) {
          if (docSnap.exists()) {
            setRemoteRedirectBarcode(docSnap.data() as BarcodeRecord);
          } else {
            setRemoteRedirectBarcode(null);
          }
        }
      } catch {
        if (!cancelled) {
          setRemoteRedirectBarcode(null);
        }
      } finally {
        if (!cancelled) {
          setRemoteResolvedCode(activeShortCode);
        }
      }
    }
    fetchRemoteCode();
    return () => {
      cancelled = true;
    };
  }, [viewMode, activeShortCode, barcodes]);

  // Navigate to Smart Redirect view (/r/SHORTCODE)
  const navigateToRedirect = (rawShortCode: string) => {
    const code = normalizeShortCodeInput(rawShortCode);
    if (!code) return;
    setActiveShortCode(code);
    setViewMode('REDIRECT');
    try {
      window.history.pushState({}, '', `/r/${code}`);
    } catch {
      // Ignore history pushState restriction in sandboxed iframe
    }
  };

  const exitRedirectToWorkspace = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch {
      // Ignore
    }
    if (isFirebaseAuthed) {
      setViewMode(currentUser.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN');
    } else {
      setViewMode('HOME');
    }
  };

  // Google Sign-In handler: calls signInWithPopup directly inside user gesture to prevent popup blocking
  const handleGoogleLogin = async () => {
    setGlobalAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed before completing login. Please try again.');
      }
      if (code === 'auth/cancelled-popup-request') {
        throw new Error('A sign-in window is already open. Please complete sign-in there or try again.');
      }
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        String(err?.message || '').includes('popup-blocked')
      ) {
        setPendingRedirectFlag();
        setIsCompletingRedirect(true);
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      if (code === 'auth/unauthorized-domain') {
        throw new Error(
          `This domain (${window.location.hostname}) is not authorized in Firebase Authentication settings.`
        );
      }
      if (code === 'auth/network-request-failed') {
        throw new Error('Network connection interrupted. Please check your internet and try again.');
      }
      throw err;
    }
  };

  // Create or Update QR Barcode
  const handleSaveBarcode = async (
    payload: Omit<BarcodeRecord, 'createdAt' | 'updatedAt'>
  ) => {
    const nowIso = new Date().toISOString();

    setBarcodes((prev) => {
      const exists = prev.some((b) => b.shortCode === payload.shortCode);
      if (exists) {
        return prev.map((b) =>
          b.shortCode === payload.shortCode ? { ...b, ...payload, updatedAt: nowIso } : b
        );
      }
      return [{ ...payload, createdAt: nowIso, updatedAt: nowIso }, ...prev];
    });

    if (isFirebaseAuthed && auth.currentUser) {
      const path = `barcodes/${payload.shortCode}`;
      try {
        const ref = doc(db, 'barcodes', payload.shortCode);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, {
            title: payload.title,
            type: payload.type,
            destination: payload.destination,
            redirectMode: payload.redirectMode,
            redirectDelaySeconds: payload.redirectDelaySeconds,
            welcomeMessage: payload.welcomeMessage,
            ctaText: payload.ctaText,
            qrColor: payload.qrColor,
            hideBranding: payload.hideBranding,
            codeActive: payload.codeActive,
            isDeleted: payload.isDeleted,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(ref, {
            ...payload,
            ownerId: auth.currentUser.uid,
            ownerEmail: auth.currentUser.email || payload.ownerEmail,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  // Toggle Barcode Active/Paused
  const handleToggleBarcodeActive = async (barcode: BarcodeRecord) => {
    const nextActive = !barcode.codeActive;
    setBarcodes((prev) =>
      prev.map((b) =>
        b.shortCode === barcode.shortCode ? { ...b, codeActive: nextActive } : b
      )
    );

    if (isFirebaseAuthed && auth.currentUser) {
      const path = `barcodes/${barcode.shortCode}`;
      try {
        await updateDoc(doc(db, 'barcodes', barcode.shortCode), {
          codeActive: nextActive,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Soft Delete & Restore Barcode
  const handleSoftDeleteBarcode = async (barcode: BarcodeRecord) => {
    setBarcodes((prev) =>
      prev.map((b) =>
        b.shortCode === barcode.shortCode
          ? { ...b, isDeleted: true, codeActive: false }
          : b
      )
    );

    if (isFirebaseAuthed && auth.currentUser) {
      const path = `barcodes/${barcode.shortCode}`;
      try {
        await updateDoc(doc(db, 'barcodes', barcode.shortCode), {
          isDeleted: true,
          codeActive: false,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const handleRestoreBarcode = async (barcode: BarcodeRecord) => {
    setBarcodes((prev) =>
      prev.map((b) =>
        b.shortCode === barcode.shortCode
          ? { ...b, isDeleted: false, codeActive: true }
          : b
      )
    );

    if (isFirebaseAuthed && auth.currentUser) {
      const path = `barcodes/${barcode.shortCode}`;
      try {
        await updateDoc(doc(db, 'barcodes', barcode.shortCode), {
          isDeleted: false,
          codeActive: true,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Hard Delete Barcode (Super Admin)
  const handleHardDeleteBarcode = async (shortCode: string) => {
    setBarcodes((prev) => prev.filter((b) => b.shortCode !== shortCode));
    if (isFirebaseAuthed && auth.currentUser) {
      const path = `barcodes/${shortCode}`;
      try {
        await deleteDoc(doc(db, 'barcodes', shortCode));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  // Atomic Scan Registration (increments scanCount by +1 & records isolated ScanLog)
  const handleRegisterAtomicScan = async (shortCode: string) => {
    const target =
      barcodes.find((b) => b.shortCode === shortCode) || remoteRedirectBarcode;
    if (!target) return;

    const newLogId = `scan-${Date.now()}`;
    const deviceSummary = `${navigator.platform || 'Browser'} · Smart Redirect Engine`;

    setBarcodes((prev) =>
      prev.map((b) =>
        b.shortCode === shortCode ? { ...b, scanCount: b.scanCount + 1 } : b
      )
    );
    setScanLogs((prev) => [
      {
        id: newLogId,
        barcodeId: shortCode,
        ownerId: target.ownerId,
        title: target.title,
        deviceInfo: deviceSummary,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    if (!target.ownerId.startsWith('demo-')) {
      const barcodeRef = doc(db, 'barcodes', shortCode);
      const scanLogRef = doc(db, 'scanLogs', newLogId);
      try {
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(barcodeRef);
          if (!snap.exists()) return;
          const data = snap.data() as BarcodeRecord;
          if (
            !data.codeActive ||
            data.isDeleted ||
            data.ownerStatus !== 'ACTIVE' ||
            data.scanCount >= data.maxScansLimit
          ) {
            return;
          }
          transaction.update(barcodeRef, {
            scanCount: data.scanCount + 1,
            updatedAt: serverTimestamp(),
          });
          transaction.set(scanLogRef, {
            barcodeId: shortCode,
            ownerId: data.ownerId,
            title: data.title.slice(0, 120),
            deviceInfo: deviceSummary.slice(0, 200),
            timestamp: serverTimestamp(),
          });
        });
      } catch {
        // Non-fatal in offline/demo mode
      }
    }
  };

  // Super Admin: Update Subscriber Plan, Quotas, Status & Sync Owner Status to Barcodes
  const handleSaveSubscriberPlan = async (
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
  ) => {
    const resolvedDelay =
      typeof updates.defaultRedirectDelaySeconds === 'number'
        ? updates.defaultRedirectDelaySeconds
        : getPlanDefaults(updates.plan).defaultRedirectDelaySeconds;

    const normalizedUpdates = {
      ...updates,
      defaultRedirectDelaySeconds: resolvedDelay,
    };

    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, ...normalizedUpdates } : u))
    );

    if (currentUser.uid === uid) {
      setCurrentUser((prev) => ({ ...prev, ...normalizedUpdates }));
    }

    const ownedBarcodes = barcodes.filter((b) => b.ownerId === uid);

    setBarcodes((prev) =>
      prev.map((b) =>
        b.ownerId === uid
          ? {
              ...b,
              ownerStatus: normalizedUpdates.status,
              maxScansLimit: normalizedUpdates.maxScansPerBarcode,
              redirectMode: normalizedUpdates.allowDirectRedirect ? b.redirectMode : 'LANDING',
              redirectDelaySeconds: normalizedUpdates.allowDirectRedirect
                ? b.redirectDelaySeconds
                : resolvedDelay,
              hideBranding: normalizedUpdates.allowWhiteLabel ? b.hideBranding : false,
            }
          : b
      )
    );

    if (isFirebaseAuthed && auth.currentUser) {
      const userPath = `users/${uid}`;
      try {
        await updateDoc(doc(db, 'users', uid), {
          ...normalizedUpdates,
          updatedAt: serverTimestamp(),
        });
        await Promise.all(
          ownedBarcodes.map((b) =>
            updateDoc(doc(db, 'barcodes', b.shortCode), {
              ownerStatus: normalizedUpdates.status,
              maxScansLimit: normalizedUpdates.maxScansPerBarcode,
              redirectMode: normalizedUpdates.allowDirectRedirect ? b.redirectMode : 'LANDING',
              redirectDelaySeconds: normalizedUpdates.allowDirectRedirect
                ? typeof b.redirectDelaySeconds === 'number'
                  ? b.redirectDelaySeconds
                  : resolvedDelay
                : resolvedDelay,
              hideBranding: normalizedUpdates.allowWhiteLabel ? b.hideBranding : false,
              updatedAt: serverTimestamp(),
            }).catch(() => {
              // Ignore individual barcode sync failure
            })
          )
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      }
    }
  };

  // Super Admin: Edit & Publish Global Subscription Plan Configuration
  const handleSaveSubscriptionPlan = async (
    updatedPlan: SubscriptionPlanConfig,
    syncExistingSubscribers: boolean
  ) => {
    const sanitized = sanitizeSubscriptionPlan(updatedPlan);

    setPlanCatalog((prev) => ({
      ...prev,
      [sanitized.plan]: sanitized,
    }));

    if (isFirebaseAuthed && auth.currentUser) {
      const planPath = `subscriptionPlans/${sanitized.plan}`;
      try {
        await setDoc(doc(db, 'subscriptionPlans', sanitized.plan), {
          ...sanitized,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, planPath);
      }
    }

    if (syncExistingSubscribers) {
      const affectedUsers = users.filter((u) => u.plan === sanitized.plan);
      await Promise.all(
        affectedUsers.map((sub) =>
          handleSaveSubscriberPlan(sub.uid, {
            plan: sanitized.plan,
            maxBarcodes: sanitized.maxBarcodes,
            maxScansPerBarcode: sanitized.maxScansPerBarcode,
            allowDirectRedirect: sanitized.allowDirectRedirect,
            allowWhiteLabel: sanitized.allowWhiteLabel,
            defaultRedirectDelaySeconds: sanitized.defaultRedirectDelaySeconds,
            status: sub.status,
            role: sub.role,
          })
        )
      );
    }
  };

  // Super Admin: Grant Email Permission or Invite New Admin/Super Admin
  const handleGrantEmailPermission = async (
    email: string,
    role: UserRole,
    plan: PlanType
  ) => {
    const cleanedEmail = email.trim().toLowerCase();
    const defaults = getPlanDefaults(plan, planCatalog);

    // 1. If the user already exists in `users`, upgrade their role and plan immediately
    const existingUser = users.find(
      (u) => u.email.trim().toLowerCase() === cleanedEmail
    );
    if (existingUser) {
      await handleSaveSubscriberPlan(existingUser.uid, {
        role,
        plan,
        maxBarcodes: defaults.maxBarcodes,
        maxScansPerBarcode: defaults.maxScansPerBarcode,
        allowDirectRedirect: defaults.allowDirectRedirect,
        allowWhiteLabel: defaults.allowWhiteLabel,
        defaultRedirectDelaySeconds: defaults.defaultRedirectDelaySeconds,
        status: 'ACTIVE',
      });
    }

    // 2. Also save in `superAdminInvites` so if they haven't logged in yet, they receive the role upon first login
    const inviteId = emailToInviteDocId(cleanedEmail);
    const newInvite: SuperAdminInviteRecord = {
      id: inviteId,
      email: cleanedEmail,
      role,
      plan,
      invitedBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };

    setInvites((prev) => [
      newInvite,
      ...prev.filter((inv) => inv.id !== inviteId),
    ]);

    if (isFirebaseAuthed && auth.currentUser) {
      const invitePath = `superAdminInvites/${inviteId}`;
      try {
        await setDoc(doc(db, 'superAdminInvites', inviteId), {
          email: cleanedEmail,
          role,
          plan,
          invitedBy: currentUser.email,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, invitePath);
      }
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    if (isFirebaseAuthed && auth.currentUser) {
      const invitePath = `superAdminInvites/${inviteId}`;
      try {
        await deleteDoc(doc(db, 'superAdminInvites', inviteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, invitePath);
      }
    }
  };

  const handleToggleSubscriberStatus = async (subscriber: UserProfile) => {
    const nextStatus: AccountStatus =
      subscriber.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await handleSaveSubscriberPlan(subscriber.uid, {
      plan: subscriber.plan,
      maxBarcodes: subscriber.maxBarcodes,
      maxScansPerBarcode: subscriber.maxScansPerBarcode,
      allowDirectRedirect: subscriber.allowDirectRedirect,
      allowWhiteLabel: subscriber.allowWhiteLabel,
      defaultRedirectDelaySeconds: subscriber.defaultRedirectDelaySeconds,
      role: subscriber.role,
      status: nextStatus,
    });
  };

  const handleUpdateDisplayName = async (newName: string) => {
    setCurrentUser((prev) => ({ ...prev, name: newName }));
    setUsers((prev) =>
      prev.map((u) => (u.uid === currentUser.uid ? { ...u, name: newName } : u))
    );

    if (isFirebaseAuthed && auth.currentUser) {
      const userPath = `users/${auth.currentUser.uid}`;
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          name: newName.slice(0, 100),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
      }
    }
  };

  const handleSignOut = async () => {
    clearCachedSession();
    setFirebaseUid(null);
    setViewMode('HOME');
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut network errors
    }
  };

  const localRedirectBarcode = barcodes.find((b) => b.shortCode === activeShortCode);
  const matchedRemoteBarcode =
    remoteRedirectBarcode?.shortCode === activeShortCode ? remoteRedirectBarcode : null;
  const activeRedirectBarcode = localRedirectBarcode || matchedRemoteBarcode;
  const isRedirectLoading =
    viewMode === 'REDIRECT' &&
    Boolean(activeShortCode) &&
    !activeRedirectBarcode &&
    remoteResolvedCode !== activeShortCode;

  if (isCompletingRedirect && viewMode !== 'REDIRECT') {
    return (
      <div className="min-h-screen bg-[#F8F5EF] text-[#292824] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-[#E6E0D6] rounded-3xl p-8 max-w-sm w-full shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF2EC] border border-[#D97745]/25 mx-auto flex items-center justify-center">
            <img src="/icon.svg" alt="Dynamic QR" className="w-8 h-8 rounded-lg animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#292824]">Completing Google Sign-In</h1>
            <p className="text-xs text-[#6E6A63] mt-1">
              Restoring your Dynamic QR workspace securely...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {viewMode === 'HOME' && (
        <PublicHomeView
          planCatalog={planCatalog}
          externalAuthError={globalAuthError}
          onClearExternalAuthError={() => setGlobalAuthError('')}
          onGoogleLogin={handleGoogleLogin}
          onOpenScanner={() => setScannerOpen(true)}
          onResolveShortCode={navigateToRedirect}
        />
      )}

      {viewMode === 'ADMIN' && (
        <AdminDashboardView
          user={currentUser}
          barcodes={barcodes}
          scanLogs={scanLogs.filter((l) => l.ownerId === currentUser.uid)}
          planCatalog={planCatalog}
          onOpenCreateModal={() => {
            setEditingBarcode(null);
            setCreateModalOpen(true);
          }}
          onOpenEditModal={(bc) => {
            setEditingBarcode(bc);
            setCreateModalOpen(true);
          }}
          onOpenPrintModal={(bc) => setPrintingBarcode(bc)}
          onOpenScanner={() => setScannerOpen(true)}
          onToggleBarcodeActive={handleToggleBarcodeActive}
          onSoftDeleteBarcode={handleSoftDeleteBarcode}
          onRestoreBarcode={handleRestoreBarcode}
          onSimulateScan={navigateToRedirect}
          onSwitchToSuperAdmin={
            currentUser.role === 'SUPER_ADMIN'
              ? () => setViewMode('SUPER_ADMIN')
              : undefined
          }
          onUpdateDisplayName={handleUpdateDisplayName}
          onSignOut={handleSignOut}
        />
      )}

      {viewMode === 'SUPER_ADMIN' && currentUser.role === 'SUPER_ADMIN' && (
        <SuperAdminView
          currentUser={currentUser}
          users={users}
          barcodes={barcodes}
          invites={invites}
          planCatalog={planCatalog}
          onOpenPlanManager={(sub) => setManagingSubscriber(sub)}
          onOpenEditPlan={(planCfg) => setEditingPlanConfig(planCfg)}
          onToggleSubscriberStatus={handleToggleSubscriberStatus}
          onGrantEmailPermission={handleGrantEmailPermission}
          onRevokeInvite={handleRevokeInvite}
          onToggleBarcodeActive={handleToggleBarcodeActive}
          onHardDeleteBarcode={handleHardDeleteBarcode}
          onPreviewBarcodeLanding={navigateToRedirect}
          onSwitchToAdminDashboard={() => setViewMode('ADMIN')}
          onSignOut={handleSignOut}
        />
      )}

      {viewMode === 'REDIRECT' && (
        <SmartRedirectView
          shortCode={activeShortCode}
          barcode={activeRedirectBarcode}
          isLoading={isRedirectLoading}
          onRegisterAtomicScan={handleRegisterAtomicScan}
          onExitToHome={exitRedirectToWorkspace}
        />
      )}

      {/* Interactive Modals */}
      <CreateEditQRModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingBarcode(null);
        }}
        user={currentUser}
        existingBarcode={editingBarcode}
        onSave={handleSaveBarcode}
      />

      <PrintStudioModal
        barcode={printingBarcode}
        onClose={() => setPrintingBarcode(null)}
        onTestLanding={navigateToRedirect}
      />

      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResolveCode={navigateToRedirect}
      />

      <PlanManagerModal
        subscriber={managingSubscriber}
        planCatalog={planCatalog}
        onClose={() => setManagingSubscriber(null)}
        onSaveSubscriber={handleSaveSubscriberPlan}
      />

      <EditPlanModal
        planConfig={editingPlanConfig}
        subscribersOnPlanCount={
          editingPlanConfig
            ? users.filter((u) => u.plan === editingPlanConfig.plan).length
            : 0
        }
        onClose={() => setEditingPlanConfig(null)}
        onSavePlan={handleSaveSubscriptionPlan}
      />

      <OfflineIndicator />
    </ErrorBoundary>
  );
}
