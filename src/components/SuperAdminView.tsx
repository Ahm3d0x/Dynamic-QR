import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronRight,
  Crown,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  MailPlus,
  Menu,
  QrCode,
  Search,
  ShieldCheck,
  Sliders,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  BarcodeRecord,
  PlanType,
  SubscriptionPlanConfig,
  SuperAdminInviteRecord,
  UserProfile,
  UserRole,
} from '../types/qr';
import { formatPlanPrice } from '../utils/qrLogic';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { MobileMenuSheet } from './MobileMenuSheet';

interface SuperAdminViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  barcodes: BarcodeRecord[];
  invites: SuperAdminInviteRecord[];
  planCatalog: Record<PlanType, SubscriptionPlanConfig>;
  onOpenPlanManager: (subscriber: UserProfile) => void;
  onOpenEditPlan: (planConfig: SubscriptionPlanConfig) => void;
  onToggleSubscriberStatus: (subscriber: UserProfile) => Promise<void>;
  onGrantEmailPermission: (email: string, role: UserRole, plan: PlanType) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
  onToggleBarcodeActive: (barcode: BarcodeRecord) => Promise<void>;
  onHardDeleteBarcode: (shortCode: string) => Promise<void>;
  onPreviewBarcodeLanding: (shortCode: string) => void;
  onSwitchToAdminDashboard: () => void;
  onSignOut: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  currentUser,
  users,
  barcodes,
  invites,
  planCatalog,
  onOpenPlanManager,
  onOpenEditPlan,
  onToggleSubscriberStatus,
  onGrantEmailPermission,
  onRevokeInvite,
  onToggleBarcodeActive,
  onHardDeleteBarcode,
  onPreviewBarcodeLanding,
  onSwitchToAdminDashboard,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'SUBSCRIBERS' | 'PERMISSIONS' | 'BARCODES' | 'PLANS'>(
    'SUBSCRIBERS'
  );
  const [userSearch, setUserSearch] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');

  // Invite / Permission Grant form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('SUPER_ADMIN');
  const [invitePlan, setInvitePlan] = useState<PlanType>('ENTERPRISE');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [inviteErrorMsg, setInviteErrorMsg] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileTabSelect = (tab: 'SUBSCRIBERS' | 'PERMISSIONS' | 'BARCODES' | 'PLANS') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const totalScans = useMemo(
    () => barcodes.reduce((sum, b) => sum + b.scanCount, 0),
    [barcodes]
  );

  const activeUsersCount = useMemo(
    () => users.filter((u) => u.status === 'ACTIVE').length,
    [users]
  );

  const suspendedUsersCount = useMemo(
    () => users.filter((u) => u.status === 'SUSPENDED').length,
    [users]
  );

  const superAdminsCount = useMemo(
    () => users.filter((u) => u.role === 'SUPER_ADMIN').length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.plan.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredBarcodes = useMemo(() => {
    const q = barcodeSearch.trim().toLowerCase();
    if (!q) return barcodes;
    return barcodes.filter(
      (b) =>
        b.shortCode.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.ownerEmail.toLowerCase().includes(q)
    );
  }, [barcodes, barcodeSearch]);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteErrorMsg('');
    setInviteSuccessMsg('');
    const cleanedEmail = inviteEmail.trim().toLowerCase();
    if (!cleanedEmail || !cleanedEmail.includes('@')) {
      setInviteErrorMsg('Please enter a valid Gmail or Google Workspace email address.');
      return;
    }

    try {
      await onGrantEmailPermission(cleanedEmail, inviteRole, invitePlan);
      setInviteSuccessMsg(
        `Permission granted for ${cleanedEmail} (${inviteRole} · ${invitePlan}). When they sign in with Google, they will be routed automatically.`
      );
      setInviteEmail('');
    } catch (err: any) {
      setInviteErrorMsg(err?.message || 'Failed to grant permission.');
    }
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
              onClick={() => setActiveTab('SUBSCRIBERS')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'SUBSCRIBERS'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Subscribers ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PERMISSIONS')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'PERMISSIONS'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Admin Invites &amp; Access</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BARCODES')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'BARCODES'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>All QR Codes ({barcodes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PLANS')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'PLANS'
                  ? 'bg-[#D97745] text-white'
                  : 'text-[#E6E0D6] hover:bg-white/10'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Plans &amp; Quotas</span>
            </button>
          </nav>
        </div>

        <div className="p-4 space-y-2.5">
          <PWAInstallButton variant="sidebar" showFallbackGuide />

          <button
            type="button"
            onClick={onSwitchToAdminDashboard}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My QR Workspace</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Calm Mobile Top App Bar (56px) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[#233229] text-white border-b border-white/10 flex items-center justify-between gap-2">
          <BrandLogo size="sm" theme="dark" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToAdminDashboard}
              className="min-h-[38px] px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer"
            >
              Workspace
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open super admin mobile menu"
              className="min-w-[42px] min-h-[42px] flex items-center justify-center bg-white/10 hover:bg-white/15 active:scale-95 text-white rounded-xl transition-transform cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white border-b border-[#E6E0D6] px-6 py-4 items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#292824]">Platform Overview</h1>
            <p className="text-xs text-[#6E6A63]">
              Manage subscribers, grant Super Admin permissions, and moderate all dynamic QR codes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#292824]">
              <Crown className="w-4 h-4 text-[#D97745]" />
              <span>{currentUser.email}</span>
            </span>

            <button
              type="button"
              onClick={onSwitchToAdminDashboard}
              className="px-3.5 py-2 bg-[#F8F5EF] hover:bg-[#EFECE6] border border-[#E6E0D6] rounded-xl text-xs font-bold text-[#292824] cursor-pointer whitespace-nowrap"
            >
              My QR Workspace
            </button>

            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              className="p-2.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#6E6A63] hover:text-[#292824] border border-[#E6E0D6] rounded-xl cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="px-4 py-4 sm:p-6 pb-24 lg:pb-8 space-y-5 sm:space-y-6 max-w-7xl w-full mx-auto">
          {/* Mobile Title Strip */}
          <div className="lg:hidden">
            <h1 className="text-lg font-bold text-[#292824]">Platform Overview</h1>
            <p className="text-[11px] text-[#6E6A63] truncate">
              Super Admin · {currentUser.email}
            </p>
          </div>

          {/* A. Platform Overview KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#EFECE6] text-[#292824] flex items-center justify-center mb-2.5 sm:mb-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824] font-mono tabular-nums">
                {users.length}
              </div>
              <div className="text-[11px] sm:text-xs text-[#6E6A63] mt-0.5 leading-snug">
                Users · {activeUsersCount} Active · {suspendedUsersCount} Off
              </div>
            </div>

            <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mb-2.5 sm:mb-3">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824] font-mono tabular-nums">
                {barcodes.length}
              </div>
              <div className="text-[11px] sm:text-xs text-[#6E6A63] mt-0.5 leading-snug">
                Platform Codes
              </div>
            </div>

            <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#DCE9DD] text-[#2E6B3E] flex items-center justify-center mb-2.5 sm:mb-3">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824] font-mono tabular-nums">
                {totalScans.toLocaleString()}
              </div>
              <div className="text-[11px] sm:text-xs text-[#6E6A63] mt-0.5 leading-snug">
                Platform Scans
              </div>
            </div>

            <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center mb-2.5 sm:mb-3">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#292824] font-mono tabular-nums">
                {superAdminsCount}
              </div>
              <div className="text-[11px] sm:text-xs text-[#6E6A63] mt-0.5 leading-snug">
                Super Admins
              </div>
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="bg-white border border-[#E6E0D6] rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 pt-4 border-b border-[#EFECE6] flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('SUBSCRIBERS')}
                  className={`pb-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'SUBSCRIBERS'
                      ? 'border-[#D97745] text-[#292824]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#292824]'
                  }`}
                >
                  Subscribers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PERMISSIONS')}
                  className={`pb-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'PERMISSIONS'
                      ? 'border-[#D97745] text-[#292824]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#292824]'
                  }`}
                >
                  Admin Invites
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('BARCODES')}
                  className={`pb-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'BARCODES'
                      ? 'border-[#D97745] text-[#292824]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#292824]'
                  }`}
                >
                  All QR Codes ({barcodes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PLANS')}
                  className={`pb-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'PLANS'
                      ? 'border-[#D97745] text-[#292824]'
                      : 'border-transparent text-[#6E6A63] hover:text-[#292824]'
                  }`}
                >
                  Plans &amp; Quotas
                </button>
              </div>

              {activeTab === 'SUBSCRIBERS' && (
                <div className="relative mb-3 w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#6E6A63] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Search subscribers"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name or email..."
                    className="w-full min-h-[40px] pl-8 pr-3 py-1.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#D97745]"
                  />
                </div>
              )}

              {activeTab === 'BARCODES' && (
                <div className="relative mb-3 w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#6E6A63] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    aria-label="Search platform barcodes"
                    value={barcodeSearch}
                    onChange={(e) => setBarcodeSearch(e.target.value)}
                    placeholder="Search Short Code or owner..."
                    className="w-full min-h-[40px] pl-8 pr-3 py-1.5 bg-[#F8F5EF] border border-[#E6E0D6] rounded-xl text-xs text-[#292824] focus:outline-none focus:border-[#D97745]"
                  />
                </div>
              )}
            </div>

            {/* B. Subscribers Management — Mobile Cards + Desktop Table */}
            {activeTab === 'SUBSCRIBERS' && (
              <>
                <div className="md:hidden divide-y divide-[#EFECE6]">
                  {filteredUsers.map((sub) => {
                    const subBarcodes = barcodes.filter(
                      (b) => b.ownerId === sub.uid && !b.isDeleted
                    );
                    const subScans = subBarcodes.reduce((s, b) => s + b.scanCount, 0);
                    return (
                      <div key={sub.uid} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#292824] truncate">
                              {sub.name}
                            </div>
                            <div className="text-xs text-[#6E6A63] truncate">{sub.email}</div>
                          </div>
                          <span
                            className={`text-xs font-bold shrink-0 ${
                              sub.status === 'ACTIVE' ? 'text-[#2E6B3E]' : 'text-red-600'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6E6A63]">
                          <span className="font-bold text-[#D97745]">{sub.plan}</span>
                          <span>·</span>
                          <span>{sub.role}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums text-[#292824]">
                            {subBarcodes.length}/{sub.maxBarcodes} codes · {subScans.toLocaleString()} scans
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenPlanManager(sub)}
                            className="min-h-[42px] px-3 py-2 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#292824] hover:text-[#D97745] border border-[#E6E0D6] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Manage Plan
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleSubscriberStatus(sub)}
                            className="min-h-[42px] px-3 py-2 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#6E6A63] hover:text-[#292824] border border-[#E6E0D6] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {sub.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EFECE6] text-[11px] font-semibold text-[#6E6A63] bg-[#F8F5EF]">
                        <th className="py-3.5 px-6">User</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Plan &amp; Role</th>
                        <th className="py-3.5 px-4 text-right">Usage &amp; Limits</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE6] text-xs">
                      {filteredUsers.map((sub) => {
                        const subBarcodes = barcodes.filter(
                          (b) => b.ownerId === sub.uid && !b.isDeleted
                        );
                        const subScans = subBarcodes.reduce((s, b) => s + b.scanCount, 0);
                        return (
                          <tr key={sub.uid} className="hover:bg-[#F8F5EF]/60">
                            <td className="py-3.5 px-6 font-bold text-[#292824]">{sub.name}</td>
                            <td className="py-3.5 px-4 text-[#6E6A63]">{sub.email}</td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#D97745]">{sub.plan}</span>
                              <span className="text-[#6E6A63]"> · {sub.role}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#292824]">
                              {subBarcodes.length}/{sub.maxBarcodes} codes ·{' '}
                              {subScans.toLocaleString()} scans
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`font-bold ${
                                  sub.status === 'ACTIVE' ? 'text-[#2E6B3E]' : 'text-red-600'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                aria-label={`Manage Plan for ${sub.name}`}
                                onClick={() => onOpenPlanManager(sub)}
                                className="px-3 py-1.5 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#292824] hover:text-[#D97745] border border-[#E6E0D6] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Manage Plan &amp; Role
                              </button>
                              <button
                                type="button"
                                aria-label={`${sub.status === 'ACTIVE' ? 'Suspend' : 'Activate'} ${sub.name}`}
                                onClick={() => onToggleSubscriberStatus(sub)}
                                className="px-3 py-1.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#6E6A63] hover:text-[#292824] border border-[#E6E0D6] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                {sub.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Admin Invites & Permission Grant Panel */}
            {activeTab === 'PERMISSIONS' && (
              <div className="p-6 space-y-6">
                <div className="max-w-2xl bg-[#F8F5EF] border border-[#E6E0D6] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FDF2EC] text-[#D97745] flex items-center justify-center">
                      <MailPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#292824]">
                        Grant Role or Invite Account by Email
                      </h2>
                      <p className="text-xs text-[#6E6A63]">
                        Authorize any Google email to access Super Admin or a specific plan upon login
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleGrantSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-3">
                        <label
                          htmlFor="invite-email-input"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Google Account Email
                        </label>
                        <input
                          id="invite-email-input"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@gmail.com"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E6E0D6] rounded-xl text-sm text-[#292824] focus:outline-none focus:border-[#D97745]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="invite-role-select"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Granted Role
                        </label>
                        <select
                          id="invite-role-select"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as UserRole)}
                          className="w-full px-3 py-2.5 bg-white border border-[#E6E0D6] rounded-xl text-xs font-semibold text-[#292824]"
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Access)</option>
                          <option value="ADMIN">ADMIN (Standard Subscriber)</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="invite-plan-select"
                          className="block text-xs font-semibold text-[#292824] mb-1"
                        >
                          Assigned Plan
                        </label>
                        <select
                          id="invite-plan-select"
                          value={invitePlan}
                          onChange={(e) => setInvitePlan(e.target.value as PlanType)}
                          className="w-full px-3 py-2.5 bg-white border border-[#E6E0D6] rounded-xl text-xs font-semibold text-[#292824]"
                        >
                          <option value="ENTERPRISE">ENTERPRISE</option>
                          <option value="PRO">PRO</option>
                          <option value="FREE">FREE</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#D97745] hover:bg-[#c56737] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Grant Permission</span>
                        </button>
                      </div>
                    </div>

                    {inviteSuccessMsg && (
                      <div className="p-3 bg-[#DCE9DD] text-[#2E6B3E] rounded-xl text-xs font-semibold">
                        {inviteSuccessMsg}
                      </div>
                    )}

                    {inviteErrorMsg && (
                      <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                        {inviteErrorMsg}
                      </div>
                    )}
                  </form>
                </div>

                {/* Pending / Active Invitations List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#292824]">
                    Pre-Authorized Email Permissions ({invites.length})
                  </h3>
                  {invites.length === 0 ? (
                    <p className="text-xs text-[#6E6A63]">
                      No pending email invitations. The primary database owner (
                      <span className="font-mono font-semibold">ah2005211@gmail.com</span>) is
                      permanently authorized as Super Admin.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-[#E6E0D6] rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#EFECE6] text-[11px] font-semibold text-[#6E6A63] bg-[#F8F5EF]">
                            <th className="py-2.5 px-4">Authorized Email</th>
                            <th className="py-2.5 px-4">Role</th>
                            <th className="py-2.5 px-4">Plan</th>
                            <th className="py-2.5 px-4">Invited By</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFECE6] text-xs">
                          {invites.map((inv) => (
                            <tr key={inv.id}>
                              <td className="py-2.5 px-4 font-bold text-[#292824]">{inv.email}</td>
                              <td className="py-2.5 px-4 font-bold text-[#D97745]">{inv.role}</td>
                              <td className="py-2.5 px-4">{inv.plan}</td>
                              <td className="py-2.5 px-4 text-[#6E6A63]">{inv.invitedBy}</td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => onRevokeInvite(inv.id)}
                                  className="text-red-600 hover:underline font-semibold cursor-pointer"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* C. Barcode Management — Mobile Cards + Desktop Table */}
            {activeTab === 'BARCODES' && (
              <>
                <div className="md:hidden divide-y divide-[#EFECE6]">
                  {filteredBarcodes.map((bc) => (
                    <div key={bc.shortCode} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-bold text-[#D97745]">
                            {bc.shortCode}
                          </div>
                          <div className="text-sm font-bold text-[#292824] truncate">{bc.title}</div>
                          <div className="text-xs text-[#6E6A63] truncate">{bc.ownerEmail}</div>
                        </div>
                        <span
                          className={`text-xs font-bold shrink-0 ${
                            bc.codeActive && bc.ownerStatus === 'ACTIVE'
                              ? 'text-[#2E6B3E]'
                              : 'text-red-600'
                          }`}
                        >
                          {bc.ownerStatus === 'SUSPENDED'
                            ? 'Suspended'
                            : bc.codeActive
                            ? 'Active'
                            : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6E6A63]">
                        <span>
                          {bc.type} · {bc.redirectMode}
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums text-[#292824]">
                          {bc.scanCount.toLocaleString()} / {bc.maxScansLimit.toLocaleString()} scans
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onPreviewBarcodeLanding(bc.shortCode)}
                          className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#D97745] border border-[#E6E0D6] rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleBarcodeActive(bc)}
                          className="flex-1 min-h-[42px] px-3 py-2 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          {bc.codeActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onHardDeleteBarcode(bc.shortCode)}
                          aria-label={`Delete barcode ${bc.shortCode}`}
                          className="min-w-[42px] min-h-[42px] flex items-center justify-center bg-[#F8F5EF] text-[#6E6A63] hover:text-red-600 border border-[#E6E0D6] rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EFECE6] text-[11px] font-semibold text-[#6E6A63] bg-[#F8F5EF]">
                        <th className="py-3.5 px-6">Short Code</th>
                        <th className="py-3.5 px-4">Campaign Title</th>
                        <th className="py-3.5 px-4">Owner</th>
                        <th className="py-3.5 px-4">Type &amp; Routing</th>
                        <th className="py-3.5 px-4 text-right">Scans / Limit</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE6] text-xs">
                      {filteredBarcodes.map((bc) => (
                        <tr key={bc.shortCode} className="hover:bg-[#F8F5EF]/60">
                          <td className="py-3.5 px-6 font-mono font-bold text-[#D97745]">
                            {bc.shortCode}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#292824]">{bc.title}</td>
                          <td className="py-3.5 px-4 text-[#6E6A63]">{bc.ownerEmail}</td>
                          <td className="py-3.5 px-4 text-[#292824]">
                            {bc.type} · {bc.redirectMode}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {bc.scanCount.toLocaleString()} / {bc.maxScansLimit.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-bold ${
                                bc.codeActive && bc.ownerStatus === 'ACTIVE'
                                  ? 'text-[#2E6B3E]'
                                  : 'text-red-600'
                              }`}
                            >
                              {bc.ownerStatus === 'SUSPENDED'
                                ? 'Owner Suspended'
                                : bc.codeActive
                                ? 'Active'
                                : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              aria-label={`Inspect barcode ${bc.shortCode}`}
                              onClick={() => onPreviewBarcodeLanding(bc.shortCode)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8F5EF] hover:bg-[#FDF2EC] text-[#D97745] border border-[#E6E0D6] rounded-lg text-xs font-bold cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                            <button
                              type="button"
                              aria-label={`${bc.codeActive ? 'Disable' : 'Enable'} barcode ${bc.shortCode}`}
                              onClick={() => onToggleBarcodeActive(bc)}
                              className="px-2.5 py-1.5 bg-[#F8F5EF] hover:bg-[#EFECE6] text-[#292824] border border-[#E6E0D6] rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              {bc.codeActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onHardDeleteBarcode(bc.shortCode)}
                              aria-label={`Delete barcode ${bc.shortCode}`}
                              className="p-1.5 text-[#6E6A63] hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Live Plans & Pricing Control Center */}
            {activeTab === 'PLANS' && (
              <div className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#292824]">
                      Live Subscription Plans & Pricing Control
                    </h2>
                    <p className="text-xs text-[#6E6A63]">
                      Edit prices, quotas, auto-redirect timers, and features here — every change
                      updates live on all Admin Plans pages and Public Pricing.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['FREE', 'PRO', 'ENTERPRISE', 'CUSTOM'] as const).map((pKey) => {
                    const p = planCatalog[pKey];
                    const monthly = formatPlanPrice(p, 'MONTHLY');
                    const yearly = formatPlanPrice(p, 'YEARLY');
                    const subsCount = users.filter((u) => u.plan === pKey).length;

                    return (
                      <div
                        key={pKey}
                        className={`rounded-2xl p-5 border flex flex-col justify-between gap-4 text-xs ${
                          p.isHighlighted
                            ? 'bg-[#233229] text-white border-[#233229]'
                            : 'bg-[#F8F5EF] text-[#292824] border-[#E6E0D6]'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#D97745]">{p.plan}</span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                p.isVisible
                                  ? p.isHighlighted
                                    ? 'text-[#DCE9DD]'
                                    : 'text-[#2E6B3E]'
                                  : 'text-red-500'
                              }`}
                            >
                              {p.isVisible ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold">{p.label}</h3>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                p.isHighlighted ? 'text-[#E6E0D6]' : 'text-[#6E6A63]'
                              }`}
                            >
                              {p.tagline}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-current/10">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-bold font-mono tabular-nums">
                                {monthly.amountText}
                              </span>
                              <span className="text-[11px] opacity-75">{monthly.suffix}</span>
                            </div>
                            {p.priceYearly > 0 && (
                              <span className="text-[11px] opacity-75 font-mono tabular-nums block mt-0.5">
                                Yearly: {yearly.amountText} {yearly.suffix}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 border-t border-current/10 space-y-1.5">
                            <div className="flex justify-between">
                              <span className="opacity-75">Max Codes:</span>
                              <strong className="font-mono tabular-nums">
                                {p.maxBarcodes.toLocaleString()}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Max Scans/Code:</span>
                              <strong className="font-mono tabular-nums">
                                {p.maxScansPerBarcode.toLocaleString()}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Auto-Redirect:</span>
                              <strong className="font-mono tabular-nums">
                                {p.defaultRedirectDelaySeconds === 0
                                  ? 'Instant (0s)'
                                  : `${p.defaultRedirectDelaySeconds}s`}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Direct / White-Label:</span>
                              <strong>
                                {p.allowDirectRedirect ? 'Yes' : 'No'} ·{' '}
                                {p.allowWhiteLabel ? 'Yes' : 'No'}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-75">Active Users:</span>
                              <strong className="font-mono tabular-nums">{subsCount}</strong>
                            </div>
                          </div>

                          {p.features.length > 0 && (
                            <ul className="pt-2 border-t border-current/10 space-y-1">
                              {p.features.slice(0, 4).map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                                  <Check className="w-3.5 h-3.5 text-[#D97745] shrink-0 mt-0.5" />
                                  <span className="opacity-90">{f}</span>
                                </li>
                              ))}
                              {p.features.length > 4 && (
                                <li className="text-[11px] opacity-70 pl-5">
                                  +{p.features.length - 4} more features
                                </li>
                              )}
                            </ul>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label={`Edit ${p.plan} plan`}
                          onClick={() => onOpenEditPlan(p)}
                          className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            p.isHighlighted
                              ? 'bg-[#D97745] hover:bg-[#c56737] text-white'
                              : 'bg-white hover:bg-[#FDF2EC] text-[#292824] hover:text-[#D97745] border border-[#E6E0D6]'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Plan & Pricing</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modern Mobile Bottom Dock (64px + safe-area) */}
      <nav
        aria-label="Mobile super admin navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E0D6] shadow-[0_-4px_20px_rgba(35,50,41,0.06)] pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {(
            [
              { key: 'SUBSCRIBERS', label: 'Users', icon: Users },
              { key: 'PERMISSIONS', label: 'Invites', icon: UserPlus },
              { key: 'BARCODES', label: 'Codes', icon: QrCode },
              { key: 'PLANS', label: 'Plans', icon: Sliders },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key && !mobileMenuOpen;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center min-h-[52px] gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
                  isActive ? 'text-[#D97745]' : 'text-[#6E6A63]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#D97745]" />
                )}
                <span
                  className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#FDF2EC]' : ''
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`relative flex flex-col items-center justify-center min-h-[52px] gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              mobileMenuOpen ? 'text-[#D97745]' : 'text-[#6E6A63]'
            }`}
          >
            {mobileMenuOpen && (
              <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#D97745]" />
            )}
            <span
              className={`w-9 h-7 rounded-xl flex items-center justify-center transition-colors ${
                mobileMenuOpen ? 'bg-[#FDF2EC]' : ''
              }`}
            >
              <Menu className="w-[18px] h-[18px]" />
            </span>
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Modern Super Admin Mobile Menu Sheet */}
      <MobileMenuSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        headerSlot={<BrandLogo size="sm" theme="light" />}
      >
        <div className="bg-[#233229] text-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D97745] text-white flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">Super Admin Console</div>
              <div className="text-[11px] text-[#E6E0D6]/80 truncate">{currentUser.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
            <div>
              <div className="text-sm font-bold font-mono tabular-nums">{users.length}</div>
              <div className="text-[10px] text-[#E6E0D6]/75">Users</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono tabular-nums">{barcodes.length}</div>
              <div className="text-[10px] text-[#E6E0D6]/75">Codes</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono tabular-nums">
                {totalScans.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#E6E0D6]/75">Scans</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E6E0D6] rounded-2xl divide-y divide-[#EFECE6] overflow-hidden">
          {[
            {
              key: 'SUBSCRIBERS' as const,
              label: 'Subscribers Management',
              meta: `${users.length} accounts · ${activeUsersCount} active`,
              icon: Users,
            },
            {
              key: 'PERMISSIONS' as const,
              label: 'Admin Invites & Access',
              meta: `${invites.length} pre-authorized`,
              icon: UserPlus,
            },
            {
              key: 'BARCODES' as const,
              label: 'All Platform QR Codes',
              meta: `${barcodes.length} total codes`,
              icon: QrCode,
            },
            {
              key: 'PLANS' as const,
              label: 'Plans & Pricing Control',
              meta: 'Live pricing, quotas & features',
              icon: Sliders,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMobileTabSelect(item.key)}
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
        </div>

        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onSwitchToAdminDashboard();
          }}
          className="w-full min-h-[48px] px-4 py-3 bg-[#233229] hover:bg-[#1a261f] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#D97745]" />
          <span>Switch to My QR Workspace</span>
        </button>

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
