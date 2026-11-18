/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
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
  UserProfile,
  UserRole,
} from './types/qr';
import {
  DEMO_ADMIN_USER,
  DEMO_SUPER_ADMIN_USER,
  INITIAL_DEMO_BARCODES,
  INITIAL_DEMO_SCAN_LOGS,
  INITIAL_DEMO_USERS,
} from './utils/demoData';
import { getPlanDefaults, normalizeShortCodeInput } from './utils/qrLogic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicHomeView } from './components/PublicHomeView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { SuperAdminView } from './components/SuperAdminView';
import { SmartRedirectView } from './components/SmartRedirectView';
import { CreateEditQRModal } from './components/CreateEditQRModal';
import { PrintStudioModal } from './components/PrintStudioModal';
import { ScannerModal } from './components/ScannerModal';
import { PlanManagerModal } from './components/PlanManagerModal';

type ViewMode = 'HOME' | 'ADMIN' | 'SUPER_ADMIN' | 'REDIRECT';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('HOME');
  const [activeShortCode, setActiveShortCode] = useState<string>('');
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState<boolean>(false);

  // State for users, barcodes, scanLogs
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_ADMIN_USER);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_DEMO_USERS);
  const [barcodes, setBarcodes] = useState<BarcodeRecord[]>(INITIAL_DEMO_BARCODES);
  const [scanLogs, setScanLogs] = useState<ScanLogRecord[]>(INITIAL_DEMO_SCAN_LOGS);
  const [remoteRedirectBarcode, setRemoteRedirectBarcode] = useState<BarcodeRecord | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState<BarcodeRecord | null>(null);
  const [printingBarcode, setPrintingBarcode] = useState<BarcodeRecord | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [managingSubscriber, setManagingSubscriber] = useState<UserProfile | null>(null);

  // Inspect URL path or query parameters on boot (e.g. /r/QRD-8F3K9A or ?autostart=1)
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const rMatch = path.match(/^\/r\/([A-Za-z0-9_-]+)/);

      if (rMatch && rMatch[1]) {
        const code = normalizeShortCodeInput(rMatch[1]);
        setActiveShortCode(code);
        setViewMode('REDIRECT');
        return;
      }

      const queryCode = params.get('r') || params.get('id');
      if (queryCode) {
        const code = normalizeShortCodeInput(queryCode);
        setActiveShortCode(code);
        setViewMode('REDIRECT');
        return;
      }

      if (params.get('autostart') === '1') {
        setViewMode('ADMIN');
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setIsFirebaseAuthed(false);
        return;
      }

      setIsFirebaseAuthed(true);
      const userPath = `users/${fbUser.uid}`;
      try {
        const userRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userRef);
        const isSuper = fbUser.email === 'ah2005211@gmail.com';

        if (!snap.exists()) {
          const defaultTier = getPlanDefaults(isSuper ? 'ENTERPRISE' : 'FREE');
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            name: (fbUser.displayName || 'QRDynamic User').slice(0, 100),
            email: (fbUser.email || 'user@qrdynamic.app').slice(0, 200),
            role: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
            status: 'ACTIVE',
            plan: defaultTier.plan,
            maxBarcodes: defaultTier.maxBarcodes,
            maxScansPerBarcode: defaultTier.maxScansPerBarcode,
            allowDirectRedirect: defaultTier.allowDirectRedirect,
            allowWhiteLabel: defaultTier.allowWhiteLabel,
          };

          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setCurrentUser(newProfile);
          if (viewMode === 'HOME') {
            setViewMode(isSuper ? 'SUPER_ADMIN' : 'ADMIN');
          }
        } else {
          const data = snap.data() as UserProfile;
          setCurrentUser(data);
          if (viewMode === 'HOME') {
            setViewMode(data.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN');
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firestore real-time listeners when authenticated with Firebase
  useEffect(() => {
    if (!isFirebaseAuthed || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
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
    }

    return () => {
      unsubBarcodes();
      unsubLogs();
      if (unsubUsers) unsubUsers();
    };
  }, [isFirebaseAuthed, currentUser.role]);

  // Fetch single barcode from Firestore if visitor opens /r/SHORTCODE not in local cache
  useEffect(() => {
    if (viewMode !== 'REDIRECT' || !activeShortCode) return;
    const localFound = barcodes.find((b) => b.shortCode === activeShortCode);
    if (localFound) {
      setRemoteRedirectBarcode(null);
      return;
    }

    let cancelled = false;
    async function fetchRemoteCode() {
      try {
        const docSnap = await getDoc(doc(db, 'barcodes', activeShortCode));
        if (!cancelled && docSnap.exists()) {
          setRemoteRedirectBarcode(docSnap.data() as BarcodeRecord);
        }
      } catch {
        // Ignore offline/not found in demo mode
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
    setViewMode('HOME');
  };

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  // Instant Demo Role Preview handler
  const handleEnterDemoWorkspace = (role: 'ADMIN' | 'SUPER_ADMIN') => {
    if (role === 'SUPER_ADMIN') {
      const superAccount =
        users.find((u) => u.role === 'SUPER_ADMIN') || DEMO_SUPER_ADMIN_USER;
      setCurrentUser(superAccount);
      setViewMode('SUPER_ADMIN');
    } else {
      const adminAccount =
        users.find((u) => u.uid === 'demo-ahmed-01') || DEMO_ADMIN_USER;
      setCurrentUser(adminAccount);
      setViewMode('ADMIN');
    }
  };

  // Create or Update QR Barcode
  const handleSaveBarcode = async (
    payload: Omit<BarcodeRecord, 'createdAt' | 'updatedAt'>
  ) => {
    const nowIso = new Date().toISOString();

    // Update local state immediately for snappy UX
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

    // Optimistic local state update
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

    if (isFirebaseAuthed) {
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
        // Non-fatal in demo mode if barcode document is local-only
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
      | 'status'
      | 'role'
    >
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u))
    );

    if (currentUser.uid === uid) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }

    // Synchronize ownerStatus and maxScansLimit across all barcodes owned by this subscriber
    setBarcodes((prev) =>
      prev.map((b) =>
        b.ownerId === uid
          ? {
              ...b,
              ownerStatus: updates.status,
              maxScansLimit: updates.maxScansPerBarcode,
              redirectMode: updates.allowDirectRedirect ? b.redirectMode : 'LANDING',
              hideBranding: updates.allowWhiteLabel ? b.hideBranding : false,
            }
          : b
      )
    );

    if (isFirebaseAuthed && auth.currentUser) {
      const userPath = `users/${uid}`;
      try {
        await updateDoc(doc(db, 'users', uid), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, userPath);
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
    if (isFirebaseAuthed) {
      await signOut(auth);
    }
    setViewMode('HOME');
  };

  const activeRedirectBarcode =
    barcodes.find((b) => b.shortCode === activeShortCode) || remoteRedirectBarcode;

  return (
    <ErrorBoundary>
      {viewMode === 'HOME' && (
        <PublicHomeView
          onGoogleLogin={handleGoogleLogin}
          onEnterDemoWorkspace={handleEnterDemoWorkspace}
          onOpenScanner={() => setScannerOpen(true)}
          onResolveShortCode={navigateToRedirect}
        />
      )}

      {viewMode === 'ADMIN' && (
        <AdminDashboardView
          user={currentUser}
          barcodes={barcodes}
          scanLogs={scanLogs.filter((l) => l.ownerId === currentUser.uid)}
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
          onSwitchToSuperAdmin={() => handleEnterDemoWorkspace('SUPER_ADMIN')}
          onUpdateDisplayName={handleUpdateDisplayName}
          onSignOut={handleSignOut}
        />
      )}

      {viewMode === 'SUPER_ADMIN' && (
        <SuperAdminView
          currentUser={currentUser}
          users={users}
          barcodes={barcodes}
          onOpenPlanManager={(sub) => setManagingSubscriber(sub)}
          onToggleSubscriberStatus={handleToggleSubscriberStatus}
          onToggleBarcodeActive={handleToggleBarcodeActive}
          onHardDeleteBarcode={handleHardDeleteBarcode}
          onPreviewBarcodeLanding={navigateToRedirect}
          onSwitchToAdminDashboard={() => handleEnterDemoWorkspace('ADMIN')}
          onSignOut={handleSignOut}
        />
      )}

      {viewMode === 'REDIRECT' && (
        <SmartRedirectView
          shortCode={activeShortCode}
          barcode={activeRedirectBarcode}
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
        onClose={() => setManagingSubscriber(null)}
        onSaveSubscriber={handleSaveSubscriberPlan}
      />
    </ErrorBoundary>
  );
}
