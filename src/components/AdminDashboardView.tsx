import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Activity,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  BarcodeRecord,
  ContentType,
  PlanType,
  ScanLogRecord,
  SubscriptionPlanConfig,
  UserProfile,
} from '../types/qr';
import {
  buildShortLinkUrl,
  canUserCreateBarcode,
  formatPlanPrice,
  resolveAutoRedirectDelay,
} from '../utils/qrLogic';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { MobileMenuSheet } from './MobileMenuSheet';

interface AdminDashboardViewProps {
  user: UserProfile;
  barcodes: BarcodeRecord[];
  scanLogs: ScanLogRecord[];
  planCatalog: Record<PlanType, SubscriptionPlanConfig>;
  onOpenCreateModal: () => void;
  onOpenEditModal: (barcode: BarcodeRecord) => void;
  onOpenPrintModal: (barcode: BarcodeRecord) => void;
  onOpenScanner: () => void;
  onToggleBarcodeActive: (barcode: BarcodeRecord) => Promise<void>;
  onSoftDeleteBarcode: (barcode: BarcodeRecord) => Promise<void>;
  onRestoreBarcode: (barcode: BarcodeRecord) => Promise<void>;
  onSimulateScan: (shortCode: string) => void;
  onSwitchToSuperAdmin?: () => void;
  onUpdateDisplayName: (newName: string) => Promise<void>;
  onSignOut: () => void;
}

const SIX_MONTH_SERIES = [
  { month: 'Oct', scans: 420 },
  { month: 'Nov', scans: 680 },
  { month: 'Dec', scans: 610 },
  { month: 'Jan', scans: 890 },
  { month: 'Feb', scans: 1120 },
  { month: 'Mar', scans: 1450 },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  user,
  barcodes,
  scanLogs,
  planCatalog,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenPrintModal,
  onOpenScanner,
  onToggleBarcodeActive,
  onSoftDeleteBarcode,
  onRestoreBarcode,
  onSimulateScan,
  onSwitchToSuperAdmin,
  onUpdateDisplayName,
  onSignOut,
}) => {
  const [activeNav, setActiveNav] = useState<'DASHBOARD' | 'CODES' | 'LOGS' | 'PLANS' | 'SETTINGS'>(
    'DASHBOARD'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ContentType>('ALL');
  const [showDeleted, setShowDeleted] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profileSaved, setProfileSaved] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SubscriptionPlanConfig | null>(
    null
  );
  const [copiedUpgradeRequest, setCopiedUpgradeRequest] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNavSelect = (
    target: 'DASHBOARD' | 'CODES' | 'LOGS' | 'PLANS' | 'SETTINGS'
  ) => {
    setActiveNav(target);
    setMobileMenuOpen(false);
  };

  const visiblePlans = useMemo(
    () =>
      Object.values(planCatalog)
        .filter((p) => p.isVisible || p.plan === user.plan)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [planCatalog, user.plan]
  );

  const currentPlanConfig = planCatalog[user.plan];

  const userBarcodes = useMemo(
    () => barcodes.filter((b) => b.ownerId === user.uid),
    [barcodes, user.uid]
  );

  const activeUserBarcodes = useMemo(
    () => userBarcodes.filter((b) => !b.isDeleted),
    [userBarcodes]
  );

  const deletedUserBarcodes = useMemo(
    () => userBarcodes.filter((b) => b.isDeleted),
    [userBarcodes]
  );

  const totalScans = useMemo(
    () => activeUserBarcodes.reduce((acc, b) => acc + b.scanCount, 0),
    [activeUserBarcodes]
  );

  const thisMonthScans = useMemo(() => Math.round(totalScans * 0.18) || 208, [totalScans]);

  const filteredBarcodes = useMemo(() => {
    const source = showDeleted ? deletedUserBarcodes : activeUserBarcodes;
    return source.filter((b) => {
      const matchesType = typeFilter === 'ALL' || b.type === typeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.shortCode.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [activeUserBarcodes, deletedUserBarcodes, showDeleted, typeFilter, searchQuery]);

  const quotaCheck = canUserCreateBarcode(user, activeUserBarcodes.length);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    await onUpdateDisplayName(profileName.trim());
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#292824] flex flex-col lg:flex-row">
      {/* Desktop Dark Forest Green Sidebar (#233229) */}
      <aside className="hidden lg:flex lg:w-64 bg-[#233229] text-white flex-col justify-between shrink-0 border-r border-white/10">
        <div>
          <div className="p-6 flex items-center justify-between">
            <BrandLogo size="md" theme="dark" />
          </div>

          <nav className="px-3 pb-4 space-y-1 flex flex-col">
            <button
              type="button"
              onClick={() => setActiveNav('DASHBOARD')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeNav === 'DASHBOARD'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('CODES')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeNav === 'CODES'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>My QR Codes ({activeUserBarcodes.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              disabled={!quotaCheck.allowed}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-[#E6E0D6] hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40"
            >
              <Plus className="w-4 h-4 shrink-0 text-[#D97745]" />
              <span>Create QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('LOGS')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeNav === 'LOGS'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Scan Logs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('PLANS')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeNav === 'PLANS'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <Crown className="w-4 h-4 shrink-0" />
              <span>Plans &amp; Pricing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('SETTINGS')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeNav === 'SETTINGS'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Clickable Plan Card, PWA Install & Role Switcher */}
        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => setActiveNav('PLANS')}
            aria-label="View subscription plans and details"
            className={`w-full rounded-2xl p-4 text-center transition-colors cursor-pointer border ${
              activeNav === 'PLANS'
                ? 'bg-[#D97745]/20 border-[#D97745]'
                : 'bg-white/10 hover:bg-white/15 border-transparent hover:border-[#D97745]/50'
            }`}
          >
            <Crown className="w-6 h-6 text-[#D97745] mx-auto mb-1.5" />
            <span className="text-xs font-bold block text-white">
              {currentPlanConfig?.label || `${user.plan} Plan`} Active
            </span>
            <span className="text-[11px] text-[#E6E0D6] block mt-0.5 tabular-nums">
              {activeUserBarcodes.length} / {user.maxBarcodes} codes used
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97745] mt-2">
              <span>View Plans</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          <PWAInstallButton variant="sidebar" showFallbackGuide />

          {user.role === 'SUPER_ADMIN' && onSwitchToSuperAdmin && (
            <button
              type="button"
              onClick={onSwitchToSuperAdmin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#D97745]/20 hover:bg-[#D97745] text-[#D97745] hover:text-white border border-[#D97745]/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Platform Console</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Calm Mobile Top App Bar (56px) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[#233229] text-white border-b border-white/10 flex items-center justify-between gap-2">
          <BrandLogo size="sm" theme="dark" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenScanner}
              aria-label="Open QR Scanner"
              className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white transition-transform cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#D97745]" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white transition-transform cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Top Header */}
        <header className="hidden lg:flex bg-white border-b border-[#E6E0D6] px-6 py-4 items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#292824]">
              Hello, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-xs text-[#6E6A63]">
              Here is your dynamic QR overview · Account Status:{' '}
              <strong className="text-[#292824]">{user.status}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 text-[#D97745]" />
              <span>Scanner</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              disabled={!quotaCheck.allowed}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create QR</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out to home"
              className="p-2.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#6E6A63] hover:text-[#292824] border border-[#E6E0D6] rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Quota Warning Banner if limit reached or suspended */}
        {!quotaCheck.allowed && (
          <div className="mx-4 lg:mx-6 mt-4 p-3.5 bg-[#FDF2EC] border border-[#D97745] rounded-2xl text-xs font-semibold text-[#292824] flex items-center justify-between">
            <span>{quotaCheck.reason}</span>
          </div>
        )}

        <main className="px-4 py-4 sm:p-6 pb-24 lg:pb-8 space-y-5 sm:space-y-6 max-w-7xl w-full mx-auto">
          {/* Mobile Contextual Greeting Strip */}
          <div className="lg:hidden flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#292824] truncate">
                Hello, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-[11px] text-[#6E6A63] truncate">
                {currentPlanConfig?.label || user.plan} · {activeUserBarcodes.length}/{user.maxBarcodes} codes · {user.status}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('PLANS')}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] bg-white border border-[#E6E0D6] rounded-xl text-[11px] font-bold text-[#D97745] shrink-0 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{user.plan}</span>
            </button>
          </div>

          {/* 4 KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mb-2.5 sm:mb-3">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824] font-mono tabular-nums">
                {activeUserBarcodes.length}{' '}
                <span className="text-xs font-normal text-[#6E6A63]">/ {user.maxBarcodes}</span>
              </div>
              <div className="text-xs text-[#6E6A63] mt-0.5">Total Codes</div>
            </div>

            <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#DCE9DD] text-[#2E6B3E] flex items-center justify-center mb-2.5 sm:mb-3">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824] font-mono tabular-nums">
                {totalScans.toLocaleString()}
              </div>
              <div className="text-xs text-[#6E6A63] mt-0.5">Total Scans</div>
            </div>

            <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#EFECE6] text-[#292824] flex items-center justify-center mb-2.5 sm:mb-3">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824] font-mono tabular-nums">
                ~ {thisMonthScans.toLocaleString()}
              </div>
              <div className="text-xs text-[#6E6A63] mt-0.5">This Month</div>
            </div>

            <button
              type="button"
              onClick={() => setActiveNav('PLANS')}
              className="text-left bg-white hover:border-[#D97745] border border-[#E6E0D6] rounded-2xl p-4 sm:p-5 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#DCE9DD] text-[#2E6B3E] flex items-center justify-center mb-2.5 sm:mb-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824]">{user.plan}</div>
              <div className="text-xs text-[#6E6A63] mt-0.5 truncate">
                Max {user.maxScansPerBarcode.toLocaleString()} scans/code
              </div>
            </button>
          </div>

          {activeNav === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Scan Statistics SVG Area Chart */}
              <div className="lg:col-span-8 bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#292824]">Scan Statistics</h2>
                    <p className="text-xs text-[#6E6A63]">
                      Monthly dynamic redirection volume across your active campaigns
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#6E6A63] bg-[#F8F5EF] border border-[#E6E0D6] px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                    Last 6 Months
                  </span>
                </div>

                <div className="h-44 w-full pt-4">
                  <svg viewBox="0 0 600 160" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="scanAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D97745" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#D97745" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {[30, 75, 120].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="600"
                        y2={y}
                        stroke="#EFECE6"
                        strokeDasharray="4 4"
                      />
                    ))}
                    <path
                      d="M 20 115 L 130 85 L 240 92 L 350 62 L 460 44 L 580 22 L 580 140 L 20 140 Z"
                      fill="url(#scanAreaGrad)"
                    />
                    <path
                      d="M 20 115 L 130 85 L 240 92 L 350 62 L 460 44 L 580 22"
                      fill="none"
                      stroke="#D97745"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {[
                      { x: 20, y: 115, label: 'Oct' },
                      { x: 130, y: 85, label: 'Nov' },
                      { x: 240, y: 92, label: 'Dec' },
                      { x: 350, y: 62, label: 'Jan' },
                      { x: 460, y: 44, label: 'Feb' },
                      { x: 580, y: 22, label: 'Mar' },
                    ].map((pt) => (
                      <g key={pt.label}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4.5"
                          fill="#FFFFFF"
                          stroke="#D97745"
                          strokeWidth="2.5"
                        />
                        <text
                          x={pt.x}
                          y={156}
                          textAnchor="middle"
                          className="text-[11px] fill-[#6E6A63]"
                        >
                          {pt.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Quick Actions Box matching Image 2 top-right */}
              <div className="lg:col-span-4 bg-white border border-[#E6E0D6] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#292824] mb-1">Quick Actions</h2>
                  <p className="text-xs text-[#6E6A63] mb-4">
                    Common workflows for your printed QR fleet
                  </p>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={onOpenCreateModal}
                      disabled={!quotaCheck.allowed}
                      className="w-full flex items-center gap-3 p-3 bg-[#F8F5EF] hover:bg-[#FDF2EC] border border-[#E6E0D6] rounded-xl text-xs font-bold text-[#292824] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-[#D97745]" />
                      <span>Create New QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveNav('CODES')}
                      className="w-full flex items-center gap-3 p-3 bg-[#F8F5EF] hover:bg-[#FDF2EC] border border-[#E6E0D6] rounded-xl text-xs font-bold text-[#292824] transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-[#D97745]" />
                      <span>View All Codes ({activeUserBarcodes.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenScanner}
                      className="w-full flex items-center gap-3 p-3 bg-[#F8F5EF] hover:bg-[#FDF2EC] border border-[#E6E0D6] rounded-xl text-xs font-bold text-[#292824] transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#D97745]" />
                      <span>Launch QR Scanner</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EFECE6] text-[11px] text-[#6E6A63] flex justify-between">
                  <span>Direct Routing: {user.allowDirectRedirect ? 'Enabled' : 'Locked'}</span>
                  <span>·</span>
                  <span>White-Label: {user.allowWhiteLabel ? 'Enabled' : 'Locked'}</span>
                </div>
              </div>
            </div>
          )}

          {/* QR Codes Section (Visible on DASHBOARD and CODES tabs) */}
          {(activeNav === 'DASHBOARD' || activeNav === 'CODES') && (
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#292824]">
                    {showDeleted ? 'Soft-Deleted QR Codes (Recovery Bin)' : 'Your Dynamic QR Codes'}
                  </h2>
                  <p className="text-xs text-[#6E6A63]">
                    Edit destination URLs anytime while keeping the printed Short Code intact
                  </p>
                </div>

                {/* Search & Content Type Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-[#6E6A63] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      aria-label="Filter QR codes"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title or Short ID..."
                      className="w-full min-h-[42px] pl-8 pr-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#D97745]"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                    <select
                      aria-label="Filter by content type"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as 'ALL' | ContentType)}
                      className="w-full sm:w-auto min-h-[42px] px-3 py-2 bg-white border border-[#E6E0D6] rounded-xl text-xs font-semibold text-[#292824]"
                    >
                      <option value="ALL">All Types (6)</option>
                      <option value="URL">URL</option>
                      <option value="TEXT">TEXT</option>
                      <option value="IMAGE">IMAGE</option>
                      <option value="VCARD">VCARD</option>
                      <option value="WIFI">WIFI</option>
                      <option value="GEO_EVENT">GEO_EVENT</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowDeleted(!showDeleted)}
                      className={`w-full sm:w-auto min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        showDeleted
                          ? 'bg-[#233229] text-white border-[#233229]'
                          : 'bg-white text-[#6E6A63] border-[#E6E0D6] hover:text-[#292824]'
                      }`}
                    >
                      Trash ({deletedUserBarcodes.length})
                    </button>
                  </div>
                </div>
              </div>

              {filteredBarcodes.length === 0 ? (
                <div className="bg-white border border-[#E6E0D6] rounded-2xl p-10 text-center">
                  <QrCode className="w-10 h-10 text-[#D97745] mx-auto mb-2" />
                  <h3 className="text-base font-bold text-[#292824]">
                    {showDeleted ? 'No deleted QR codes' : 'No matching QR codes found'}
                  </h3>
                  <p className="text-xs text-[#6E6A63] mt-1 mb-4">
                    Create a dynamic QR code to start routing scans in real time.
                  </p>
                  {!showDeleted && (
                    <button
                      type="button"
                      onClick={onOpenCreateModal}
                      disabled={!quotaCheck.allowed}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D97745] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First QR Code</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBarcodes.map((bc) => {
                    const shortUrl = buildShortLinkUrl(bc.shortCode);
                    return (
                      <div
                        key={bc.shortCode}
                        className="bg-white border border-[#E6E0D6] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[#D97745]/60 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <button
                            type="button"
                            onClick={() => onOpenPrintModal(bc)}
                            aria-label={`Open Print Studio for ${bc.title}`}
                            className="p-2 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl shrink-0 cursor-pointer hover:border-[#D97745]"
                          >
                            <QRCodeSVG
                              value={shortUrl}
                              size={56}
                              fgColor={bc.qrColor || '#292824'}
                              bgColor="#FFFFFF"
                            />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-[#292824] truncate">
                                {bc.title}
                              </h3>
                              {/* Clean unboxed metadata status */}
                              <span
                                className={`text-[11px] font-bold shrink-0 ${
                                  bc.codeActive ? 'text-[#2E6B3E]' : 'text-[#6E6A63]'
                                }`}
                              >
                                {bc.codeActive ? 'Active' : 'Paused'}
                              </span>
                            </div>

                            <div className="text-xs text-[#6E6A63] mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-semibold text-[#292824]">
                                {bc.shortCode}
                              </span>
                              <span>·</span>
                              <span>{bc.type}</span>
                              <span>·</span>
                              <span>
                                {bc.type === 'URL'
                                  ? (() => {
                                      const d = resolveAutoRedirectDelay(bc);
                                      return d === 0 ? 'Instant' : `Auto ${d}s`;
                                    })()
                                  : bc.redirectMode}
                              </span>
                            </div>

                            <div className="mt-2 text-xs font-mono text-[#6E6A63] tabular-nums">
                              <strong className="text-[#292824]">
                                {bc.scanCount.toLocaleString()}
                              </strong>{' '}
                              / {bc.maxScansLimit.toLocaleString()} scans
                            </div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-3 border-t border-[#EFECE6] flex flex-wrap items-center justify-between gap-2">
                          {!bc.isDeleted ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenEditModal(bc)}
                                  aria-label={`Edit ${bc.title}`}
                                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#292824] hover:text-[#D97745] border border-[#E6E0D6] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onOpenPrintModal(bc)}
                                  aria-label={`Print ${bc.title}`}
                                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#292824] hover:text-[#D97745] border border-[#E6E0D6] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onSimulateScan(bc.shortCode)}
                                  aria-label={`Test scan ${bc.title}`}
                                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#D97745] border border-[#E6E0D6] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Scan</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={bc.codeActive}
                                  aria-label={`Toggle active status for ${bc.title}`}
                                  onClick={() => onToggleBarcodeActive(bc)}
                                  className={`w-10 h-5.5 rounded-full transition-colors p-0.5 cursor-pointer ${
                                    bc.codeActive ? 'bg-[#2E6B3E]' : 'bg-[#D1CBC0]'
                                  }`}
                                >
                                  <span
                                    className={`block w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                                      bc.codeActive ? 'translate-x-4.5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onSoftDeleteBarcode(bc)}
                                  aria-label={`Delete ${bc.title}`}
                                  className="p-1.5 text-[#6E6A63] hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRestoreBarcode(bc)}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#DCE9DD] text-[#2E6B3E] rounded-lg text-xs font-bold cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore Soft-Deleted QR</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Scan Logs Tab */}
          {activeNav === 'LOGS' && (
            <section className="bg-white border border-[#E6E0D6] rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#EFECE6] flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#292824]">
                    Atomic Scan Activity Logs
                  </h2>
                  <p className="text-xs text-[#6E6A63] mt-0.5">
                    Isolated scanLog records prevent Firestore document contention on high-traffic QRs
                  </p>
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#6E6A63] bg-[#F8F5EF] border border-[#E6E0D6] px-2.5 py-1 rounded-lg tabular-nums whitespace-nowrap shrink-0">
                  {scanLogs.length} events
                </span>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-[#EFECE6]">
                {scanLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#6E6A63]">
                    No scan activity logged yet.
                  </div>
                ) : (
                  scanLogs.map((log) => (
                    <div key={log.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-[#D97745]">
                          {log.barcodeId}
                        </span>
                        <span className="text-[11px] font-mono text-[#6E6A63] tabular-nums whitespace-nowrap">
                          {typeof log.timestamp === 'string'
                            ? new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#292824] truncate">{log.title}</div>
                      <div className="text-xs text-[#6E6A63] truncate">{log.deviceInfo}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EFECE6] text-[11px] font-semibold text-[#6E6A63] bg-[#F8F5EF]">
                      <th className="py-3 px-4">Short Code</th>
                      <th className="py-3 px-4">Campaign</th>
                      <th className="py-3 px-4">Visitor Client / Metadata</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE6] text-xs">
                    {scanLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F8F5EF]/60">
                        <td className="py-3 px-4 font-mono font-bold text-[#D97745]">
                          {log.barcodeId}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#292824]">{log.title}</td>
                        <td className="py-3 px-4 text-[#6E6A63]">{log.deviceInfo}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#6E6A63] tabular-nums">
                          {typeof log.timestamp === 'string'
                            ? new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Plans & Pricing Tab (Synced live with Super Admin) */}
          {activeNav === 'PLANS' && (
            <section className="space-y-6">
              {/* Current Plan Overview & Billing Cycle Switcher */}
              <div className="bg-white border border-[#E6E0D6] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D97745]">
                    <Crown className="w-4 h-4 shrink-0" />
                    <span>Your Active Subscription · {currentPlanConfig?.label || user.plan}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#292824]">
                    Subscription Plans &amp; Quota Details
                  </h2>
                  <p className="text-xs text-[#6E6A63] leading-relaxed">
                    Compare available plans, scan limits, auto-routing timers, and white-label
                    capabilities. Usage quotas apply immediately across all your dynamic QR codes.
                  </p>
                </div>

                {/* Monthly / Yearly Toggle + Clean Usage Summary */}
                <div className="flex flex-col sm:items-end gap-3 shrink-0">
                  <div className="grid grid-cols-2 sm:inline-flex items-center p-1 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('MONTHLY')}
                      className={`min-h-[38px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        billingCycle === 'MONTHLY'
                          ? 'bg-[#233229] text-white'
                          : 'text-[#6E6A63] hover:text-[#292824]'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('YEARLY')}
                      className={`min-h-[38px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        billingCycle === 'YEARLY'
                          ? 'bg-[#233229] text-white'
                          : 'text-[#6E6A63] hover:text-[#292824]'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>

                  <div className="flex flex-wrap sm:justify-end gap-1.5 text-[11px] font-mono tabular-nums text-[#6E6A63]">
                    <span className="px-2.5 py-1 rounded-lg bg-[#F8F5EF] border border-[#E6E0D6]">
                      <strong className="text-[#292824]">
                        {activeUserBarcodes.length}/{user.maxBarcodes}
                      </strong>{' '}
                      codes
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F8F5EF] border border-[#E6E0D6]">
                      <strong className="text-[#292824]">
                        {user.maxScansPerBarcode.toLocaleString()}
                      </strong>{' '}
                      scans/code
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F8F5EF] border border-[#E6E0D6]">
                      <strong className="text-[#292824]">
                        {user.allowDirectRedirect
                          ? '0–30s auto-route'
                          : `Fixed ${user.defaultRedirectDelaySeconds ?? 5}s`}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Upgrade Request Notice Banner */}
              {selectedUpgradePlan && (
                <div className="bg-[#FDF2EC] border border-[#D97745] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#292824]">
                      Upgrade Request · {selectedUpgradePlan.label} ({selectedUpgradePlan.plan})
                    </h3>
                    <p className="text-xs text-[#6E6A63]">
                      {selectedUpgradePlan.contactNote ||
                        'Contact your platform administrator to upgrade your account to this plan.'}
                    </p>
                    <p className="text-[11px] font-mono text-[#292824]">
                      Account: {user.email} · Requested: {selectedUpgradePlan.plan} (
                      {billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        const summary = `Dynamic QR Upgrade Request — Account: ${user.email}, Current Plan: ${user.plan}, Requested Plan: ${selectedUpgradePlan.label} (${selectedUpgradePlan.plan} - ${billingCycle})`;
                        try {
                          await navigator.clipboard.writeText(summary);
                        } catch {
                          // Ignore clipboard restriction
                        }
                        setCopiedUpgradeRequest(true);
                        setTimeout(() => setCopiedUpgradeRequest(false), 2500);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      {copiedUpgradeRequest ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Details Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Upgrade Details</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUpgradePlan(null)}
                      className="px-3 py-2 bg-white border border-[#E6E0D6] text-xs font-semibold text-[#6E6A63] rounded-xl cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Live Plan Cards Grid */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 ${
                  visiblePlans.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
                } gap-5`}
              >
                {visiblePlans.map((tier) => {
                  const isCurrent = user.plan === tier.plan;
                  const price = formatPlanPrice(tier, billingCycle);
                  const highlighted = tier.isHighlighted;

                  return (
                    <div
                      key={tier.plan}
                      className={`rounded-3xl p-6 border flex flex-col justify-between gap-6 transition-colors ${
                        highlighted
                          ? 'bg-[#233229] text-white border-[#233229]'
                          : isCurrent
                          ? 'bg-white text-[#292824] border-2 border-[#D97745]'
                          : 'bg-white text-[#292824] border-[#E6E0D6]'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold tracking-wide ${
                              highlighted ? 'text-[#D97745]' : 'text-[#6E6A63]'
                            }`}
                          >
                            {tier.plan}
                          </span>
                          {isCurrent ? (
                            <span className="text-[11px] font-bold text-[#2E6B3E] bg-[#DCE9DD] px-2.5 py-0.5 rounded-lg">
                              Active Plan
                            </span>
                          ) : highlighted ? (
                            <span className="text-[11px] font-bold text-[#D97745]">
                              Most Popular
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <h3 className="text-xl font-bold">{tier.label}</h3>
                          <p
                            className={`text-xs mt-1 ${
                              highlighted ? 'text-[#E6E0D6]' : 'text-[#6E6A63]'
                            }`}
                          >
                            {tier.tagline}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-current/10">
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <span className="text-3xl font-bold font-mono tabular-nums">
                              {price.amountText}
                            </span>
                            <span className="text-xs opacity-75 whitespace-nowrap">
                              {price.suffix}
                            </span>
                          </div>
                        </div>

                        {/* Core Quotas Summary */}
                        <div className="pt-3 border-t border-current/10 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="opacity-75">Dynamic QR Codes</span>
                            <strong className="font-mono tabular-nums text-right">
                              {tier.maxBarcodes.toLocaleString()}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="opacity-75">Scans / Code</span>
                            <strong className="font-mono tabular-nums text-right">
                              {tier.maxScansPerBarcode.toLocaleString()}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="opacity-75">Auto-Redirect</span>
                            <strong className="font-mono tabular-nums text-right whitespace-nowrap">
                              {tier.allowDirectRedirect
                                ? tier.defaultRedirectDelaySeconds === 0
                                  ? 'Instant (0–30s)'
                                  : `Custom (${tier.defaultRedirectDelaySeconds}s)`
                                : `Fixed ${tier.defaultRedirectDelaySeconds}s`}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="opacity-75">White-Label</span>
                            <strong className="text-right">
                              {tier.allowWhiteLabel ? 'Included' : 'Standard'}
                            </strong>
                          </div>
                        </div>

                        {/* Feature Checklist */}
                        {tier.features.length > 0 && (
                          <ul className="pt-3 border-t border-current/10 space-y-2 text-xs">
                            {tier.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#D97745] shrink-0 mt-0.5" />
                                <span className="opacity-90 leading-snug">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {isCurrent ? (
                        <div
                          className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center ${
                            highlighted
                              ? 'bg-white/15 text-white'
                              : 'bg-[#F8F5EF] text-[#2E6B3E] border border-[#DCE9DD]'
                          }`}
                        >
                          Current Active Plan
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUpgradePlan(tier);
                            setCopiedUpgradeRequest(false);
                          }}
                          className={`w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            highlighted
                              ? 'bg-[#D97745] hover:bg-[#c56737] text-white'
                              : 'bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#292824] hover:text-[#D97745] border border-[#E6E0D6]'
                          }`}
                        >
                          <span>{tier.ctaLabel || `Choose ${tier.label}`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Side-by-side Feature Comparison Matrix */}
              <div className="bg-white border border-[#E6E0D6] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#EFECE6]">
                  <h3 className="text-sm font-bold text-[#292824]">Full Plan Comparison Matrix</h3>
                  <p className="text-xs text-[#6E6A63]">
                    Live capabilities synced directly from platform settings
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#EFECE6] bg-[#F8F5EF] text-[#6E6A63]">
                        <th className="py-3 px-5 font-semibold">Feature / Limit</th>
                        {visiblePlans.map((p) => (
                          <th key={p.plan} className="py-3 px-4 font-bold text-[#292824]">
                            {p.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE6]">
                      <tr>
                        <td className="py-3 px-5 font-semibold text-[#292824]">
                          Price ({billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'})
                        </td>
                        {visiblePlans.map((p) => {
                          const pr = formatPlanPrice(p, billingCycle);
                          return (
                            <td
                              key={p.plan}
                              className="py-3 px-4 font-mono font-bold text-[#D97745] tabular-nums"
                            >
                              {pr.amountText} <span className="font-normal text-[#6E6A63]">{pr.suffix}</span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-semibold text-[#292824]">Dynamic QR Codes</td>
                        {visiblePlans.map((p) => (
                          <td key={p.plan} className="py-3 px-4 font-mono tabular-nums">
                            {p.maxBarcodes.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-semibold text-[#292824]">
                          Max Scans per Code
                        </td>
                        {visiblePlans.map((p) => (
                          <td key={p.plan} className="py-3 px-4 font-mono tabular-nums">
                            {p.maxScansPerBarcode.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-semibold text-[#292824]">
                          Auto-Redirect Timer
                        </td>
                        {visiblePlans.map((p) => (
                          <td key={p.plan} className="py-3 px-4 font-mono tabular-nums">
                            {p.allowDirectRedirect
                              ? `0–30s (Default ${p.defaultRedirectDelaySeconds}s)`
                              : `Fixed ${p.defaultRedirectDelaySeconds}s`}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-semibold text-[#292824]">Direct Redirect</td>
                        {visiblePlans.map((p) => (
                          <td key={p.plan} className="py-3 px-4">
                            <span
                              className={
                                p.allowDirectRedirect
                                  ? 'font-bold text-[#2E6B3E]'
                                  : 'text-[#6E6A63]'
                              }
                            >
                              {p.allowDirectRedirect ? 'Enabled' : 'Smart Landing Only'}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-semibold text-[#292824]">
                          White-Label Branding
                        </td>
                        {visiblePlans.map((p) => (
                          <td key={p.plan} className="py-3 px-4">
                            <span
                              className={
                                p.allowWhiteLabel ? 'font-bold text-[#2E6B3E]' : 'text-[#6E6A63]'
                              }
                            >
                              {p.allowWhiteLabel ? 'Included' : 'Not Included'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Account Settings Tab */}
          {activeNav === 'SETTINGS' && (
            <div className="max-w-2xl space-y-5">
              <PWAInstallButton variant="card" showFallbackGuide />

              <section className="bg-white border border-[#E6E0D6] rounded-2xl p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-[#292824]">Account Profile &amp; Plan</h2>
                  <p className="text-xs text-[#6E6A63]">
                    Role and quota limits are enforced in Firestore security rules
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label
                      htmlFor="settings-display-name"
                      className="block text-xs font-semibold text-[#292824] mb-1"
                    >
                      Display Name
                    </label>
                    <input
                      id="settings-display-name"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#F8F5EF] rounded-xl border border-[#E6E0D6]">
                      <span className="text-[#6E6A63] block">Email</span>
                      <span className="font-semibold text-[#292824] break-all">{user.email}</span>
                    </div>
                    <div className="p-3 bg-[#F8F5EF] rounded-xl border border-[#E6E0D6]">
                      <span className="text-[#6E6A63] block">Role &amp; Plan</span>
                      <span className="font-semibold text-[#292824]">
                        {user.role} · {user.plan}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2.5 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {profileSaved ? 'Profile Updated!' : 'Save Display Name'}
                  </button>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Modern Mobile Bottom Dock (64px + safe-area) */}
      <nav
        aria-label="Mobile workspace navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E0D6] shadow-[0_-4px_20px_rgba(35,50,41,0.06)] pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1.5">
          <button
            type="button"
            onClick={() => setActiveNav('DASHBOARD')}
            className={`relative flex flex-col items-center justify-center min-h-[52px] gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              activeNav === 'DASHBOARD' ? 'text-[#D97745]' : 'text-[#6E6A63]'
            }`}
          >
            {activeNav === 'DASHBOARD' && (
              <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#D97745]" />
            )}
            <span
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                activeNav === 'DASHBOARD' ? 'bg-[#FDF2EC]' : ''
              }`}
            >
              <LayoutDashboard className="w-[18px] h-[18px]" />
            </span>
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('CODES')}
            className={`relative flex flex-col items-center justify-center min-h-[52px] gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              activeNav === 'CODES' ? 'text-[#D97745]' : 'text-[#6E6A63]'
            }`}
          >
            {activeNav === 'CODES' && (
              <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#D97745]" />
            )}
            <span
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                activeNav === 'CODES' ? 'bg-[#FDF2EC]' : ''
              }`}
            >
              <QrCode className="w-[18px] h-[18px]" />
            </span>
            <span>Codes</span>
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenCreateModal}
              disabled={!quotaCheck.allowed}
              aria-label="Create New Dynamic QR"
              className="w-13 h-13 -mt-5 rounded-2xl bg-[#D97745] hover:bg-[#c56737] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-[#D97745]/30 border-4 border-[#F8F5EF] transition-transform cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveNav('PLANS')}
            className={`relative flex flex-col items-center justify-center min-h-[52px] gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              activeNav === 'PLANS' ? 'text-[#D97745]' : 'text-[#6E6A63]'
            }`}
          >
            {activeNav === 'PLANS' && (
              <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#D97745]" />
            )}
            <span
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                activeNav === 'PLANS' ? 'bg-[#FDF2EC]' : ''
              }`}
            >
              <Crown className="w-[18px] h-[18px]" />
            </span>
            <span>Plans</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`relative flex flex-col items-center justify-center min-h-[52px] gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              mobileMenuOpen || activeNav === 'LOGS' || activeNav === 'SETTINGS'
                ? 'text-[#D97745]'
                : 'text-[#6E6A63]'
            }`}
          >
            {(mobileMenuOpen || activeNav === 'LOGS' || activeNav === 'SETTINGS') && (
              <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#D97745]" />
            )}
            <span
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                mobileMenuOpen || activeNav === 'LOGS' || activeNav === 'SETTINGS'
                  ? 'bg-[#FDF2EC]'
                  : ''
              }`}
            >
              <Menu className="w-[18px] h-[18px]" />
            </span>
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Modern Slide-Up Admin Mobile Menu Sheet */}
      <MobileMenuSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        headerSlot={<BrandLogo size="sm" theme="light" />}
      >
        {/* User Profile & Plan Quota Card */}
        <button
          type="button"
          onClick={() => handleMobileNavSelect('PLANS')}
          className="w-full text-left bg-[#233229] text-white rounded-2xl p-4 space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#D97745] text-white font-bold text-base flex items-center justify-center shrink-0">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{user.name}</div>
                <div className="text-[11px] text-[#E6E0D6]/80 truncate">{user.email}</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97745] shrink-0">
              <Crown className="w-3.5 h-3.5" />
              <span>{user.plan}</span>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#E6E0D6]">
              <span>{currentPlanConfig?.label || `${user.plan} Plan`} Quota</span>
              <span className="font-mono tabular-nums font-bold text-white">
                {activeUserBarcodes.length} / {user.maxBarcodes} codes
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D97745] rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((activeUserBarcodes.length / Math.max(1, user.maxBarcodes)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </button>

        {/* 2x2 Tactile Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!quotaCheck.allowed}
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCreateModal();
            }}
            className="p-3.5 bg-[#D97745] hover:bg-[#c56737] text-white rounded-2xl text-left space-y-1.5 active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-5 h-5" />
            <div className="text-xs font-bold">Create New QR</div>
            <div className="text-[11px] text-white/80">6 dynamic types</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenScanner();
            }}
            className="p-3.5 bg-white border border-[#E6E0D6] hover:border-[#D97745] text-[#292824] rounded-2xl text-left space-y-1.5 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <Camera className="w-5 h-5 text-[#D97745]" />
            <div className="text-xs font-bold">QR Scanner</div>
            <div className="text-[11px] text-[#6E6A63]">Camera or upload</div>
          </button>
        </div>

        {/* Workspace Navigation Rows */}
        <div className="bg-white border border-[#E6E0D6] rounded-2xl divide-y divide-[#EFECE6] overflow-hidden">
          {[
            {
              key: 'DASHBOARD' as const,
              label: 'Dashboard Overview',
              meta: 'Analytics & quick tools',
              icon: LayoutDashboard,
            },
            {
              key: 'CODES' as const,
              label: 'My Dynamic QR Codes',
              meta: `${activeUserBarcodes.length} active`,
              icon: QrCode,
            },
            {
              key: 'LOGS' as const,
              label: 'Scan Activity Logs',
              meta: `${totalScans.toLocaleString()} scans`,
              icon: History,
            },
            {
              key: 'PLANS' as const,
              label: 'Plans & Pricing',
              meta: currentPlanConfig?.label || user.plan,
              icon: Crown,
            },
            {
              key: 'SETTINGS' as const,
              label: 'Account Settings',
              meta: 'Profile & app options',
              icon: Settings,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMobileNavSelect(item.key)}
                className={`w-full min-h-[58px] px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                  isActive ? 'bg-[#FDF2EC]' : 'hover:bg-[#F8F5EF]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#D97745] text-white' : 'bg-[#F8F5EF] text-[#292824]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-bold truncate ${
                        isActive ? 'text-[#D97745]' : 'text-[#292824]'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[#6E6A63] truncate">{item.meta}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A49E93] shrink-0" />
              </button>
            );
          })}

          {user.role === 'SUPER_ADMIN' && onSwitchToSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onSwitchToSuperAdmin();
              }}
              className="w-full min-h-[58px] px-4 py-3 flex items-center justify-between gap-3 text-left bg-[#233229]/5 hover:bg-[#FDF2EC] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#233229] text-[#D97745] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#292824] truncate">
                    Platform Console
                  </div>
                  <div className="text-[11px] text-[#6E6A63] truncate">
                    Super Admin · Users &amp; Plans Control
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D97745] shrink-0" />
            </button>
          )}
        </div>

        {/* In-App PWA Install & Sign Out */}
        <PWAInstallButton variant="card" showFallbackGuide />

        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onSignOut();
          }}
          className="w-full min-h-[48px] px-4 py-3 bg-white hover:bg-red-50 text-[#6E6A63] hover:text-red-600 border border-[#E6E0D6] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </MobileMenuSheet>
    </div>
  );
};
