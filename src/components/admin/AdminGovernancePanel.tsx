import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Sliders,
  Shield,
  FileSearch,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  KeyRound,
  Lock,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import {
  ApiError,
  AuthorityProfile,
  AdminUserItem,
  AdminRuleItem,
  AdminAuditItem,
  adminListUsers,
  adminCreateUser,
  adminSetUserStatus,
  adminResendActivation,
  adminGetOrg,
  adminListRules,
  adminUpsertRule,
  adminDeleteRule,
  adminGetSettings,
  adminUpdateSetting,
  adminListAuditLogs,
} from '../../lib/api';

interface AdminGovernancePanelProps {
  language: 'en' | 'hi';
  authUser?: AuthorityProfile | null;
  onNavigateLogin: () => void;
}

export default function AdminGovernancePanel({
  language,
  authUser,
  onNavigateLogin,
}: AdminGovernancePanelProps) {
  const isHi = language === 'hi';
  const [subTab, setSubTab] = useState<'users' | 'rules' | 'settings' | 'audit'>('users');
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Users & Org state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [org, setOrg] = useState<{
    departments: Array<{ id: string; code: string; name: string }>;
    wards: Array<{ id: string; number: number; name: string }>;
    roles: Array<{ id: string; code: string; name: string; scope: string }>;
  }>({ departments: [], wards: [], roles: [] });
  const [newUser, setNewUser] = useState({ name: '', email: '', roleId: '', departmentId: '', wardId: '' });
  const [latestActivationLink, setLatestActivationLink] = useState('');

  // Rules state
  const [rules, setRules] = useState<AdminRuleItem[]>([]);
  const [newRule, setNewRule] = useState({
    departmentId: '',
    priority: '' as '' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    fromLevelOrder: 1,
    toLevelOrder: 2,
    slaHours: 24,
  });

  // Settings state
  const [settings, setSettings] = useState<Record<string, Record<string, number>>>({});

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AdminAuditItem[]>([]);
  const [auditActorFilter, setAuditActorFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setAuthRequired(true);
        setLoadError(err.message);
        return;
      }
      setLoadError(
        err instanceof Error
          ? err.message
          : isHi
          ? 'डेटाबेस से शासन डेटा लोड नहीं हो सका।'
          : 'Unable to load governance data from backend.',
      );
    },
    [isHi],
  );

  const loadUsersAndOrg = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [uRes, oRes] = await Promise.all([adminListUsers(), adminGetOrg().catch(() => null)]);
      setUsers(uRes.users);
      if (oRes) {
        setOrg({ departments: oRes.departments, wards: oRes.wards, roles: oRes.roles });
      }
      setAuthRequired(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [rRes, oRes] = await Promise.all([adminListRules(), adminGetOrg().catch(() => null)]);
      setRules(rRes.rules);
      if (oRes) {
        setOrg((prev) => ({ ...prev, departments: oRes.departments }));
      }
      setAuthRequired(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await adminGetSettings();
      setSettings(res.settings);
      setAuthRequired(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await adminListAuditLogs({
        actorType: auditActorFilter || undefined,
        action: auditActionFilter || undefined,
      });
      setAuditLogs(res.logs);
      setAuthRequired(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [auditActorFilter, auditActionFilter, handleApiError]);

  useEffect(() => {
    if (subTab === 'users') void loadUsersAndOrg();
    else if (subTab === 'rules') void loadRules();
    else if (subTab === 'settings') void loadSettings();
    else if (subTab === 'audit') void loadAudit();
  }, [subTab, loadUsersAndOrg, loadRules, loadSettings, loadAudit]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminCreateUser({
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId,
        departmentId: newUser.departmentId || undefined,
        wardId: newUser.wardId || undefined,
      });
      setLatestActivationLink(res.activationLink);
      setNewUser({ name: '', email: '', roleId: '', departmentId: '', wardId: '' });
      toast.success(isHi ? '✓ अधिकारी खाता बनाया गया और सक्रियण लिंक तैयार है!' : '✓ Authority account created with activation link!');
      await loadUsersAndOrg();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? 'उपयोगकर्ता निर्माण विफल' : 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (u: AdminUserItem) => {
    const nextStatus = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await adminSetUserStatus(u.id, nextStatus);
      toast.success(
        nextStatus === 'SUSPENDED'
          ? isHi
            ? `खाता निलंबित: ${u.name}`
            : `Suspended ${u.name}`
          : isHi
          ? `खाता पुनः सक्रिय: ${u.name}`
          : `Reactivated ${u.name}`,
      );
      await loadUsersAndOrg();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? 'स्थिति अपडेट विफल' : 'Failed to update status');
    }
  };

  const handleResendInvite = async (u: AdminUserItem) => {
    try {
      const res = await adminResendActivation(u.id);
      setLatestActivationLink(res.activationLink);
      toast.success(isHi ? 'नया सक्रियण लिंक बनाया गया!' : 'New activation link generated!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? 'लिंक बनाने में त्रुटि' : 'Failed to generate link');
    }
  };

  const handleUpsertRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRule.toLevelOrder <= newRule.fromLevelOrder) {
      toast.error(
        isHi
          ? 'लक्ष्य स्तर (To Level) स्रोत स्तर (From Level) से अधिक होना चाहिए।'
          : 'To Level must be greater than From Level.',
      );
      return;
    }
    try {
      await adminUpsertRule({
        departmentId: newRule.departmentId || undefined,
        priority: newRule.priority || undefined,
        fromLevelOrder: newRule.fromLevelOrder,
        toLevelOrder: newRule.toLevelOrder,
        slaHours: newRule.slaHours,
      });
      toast.success(isHi ? '✓ SLA नियम सहेजा गया!' : '✓ SLA rule saved!');
      await loadRules();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? 'नियम सहेजने में त्रुटि' : 'Failed to save rule');
    }
  };

  const handleDeactivateRule = async (id: string) => {
    try {
      await adminDeleteRule(id);
      toast.success(isHi ? 'नियम निष्क्रिय किया गया।' : 'Rule deactivated.');
      await loadRules();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? 'नियम निष्क्रिय करने में त्रुटि' : 'Failed to deactivate rule');
    }
  };

  const handleSaveSettingGroup = async (key: string) => {
    const groupValues = settings[key];
    if (!groupValues) return;
    try {
      const res = await adminUpdateSetting(key, groupValues);
      setSettings(res.settings);
      toast.success(isHi ? `✓ ${key} सेटिंग्स सहेजी गईं!` : `✓ Saved ${key} settings!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? 'सेटिंग अपडेट विफल' : 'Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'users', icon: Users, en: 'Authority Users', hi: 'अधिकारी उपयोगकर्ता' },
            { id: 'rules', icon: Shield, en: 'SLA Escalation Rules', hi: 'SLA एस्केलेशन नियम' },
            { id: 'settings', icon: Sliders, en: 'System Settings', hi: 'सिस्टम सेटिंग्स' },
            { id: 'audit', icon: FileSearch, en: 'Audit Logs', hi: 'ऑडिट लॉग्स' },
          ].map((item) => {
            const Icon = item.icon;
            const active = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSubTab(item.id as any)}
                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                  active ? 'bg-[#0F1B2D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#F4511E]" />
                <span>{isHi ? item.hi : item.en}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            if (subTab === 'users') void loadUsersAndOrg();
            else if (subTab === 'rules') void loadRules();
            else if (subTab === 'settings') void loadSettings();
            else void loadAudit();
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isHi ? 'रिफ्रेश' : 'Refresh'}</span>
        </button>
      </div>

      {/* Auth / Offline Callout */}
      {(authRequired || loadError) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-amber-950">
                {authRequired
                  ? isHi
                    ? 'लाइव एडमिन सत्र आवश्यक है'
                    : 'Live Authority Session Required'
                  : isHi
                  ? 'बैकएंड शासन डेटा उपलब्ध नहीं है'
                  : 'Backend Governance Data Unavailable'}
              </h3>
              <p className="text-xs text-amber-800">
                {authRequired
                  ? isHi
                    ? 'उपयोगकर्ता प्रबंधन, SLA नियम और ऑडिट लॉग लाइव डेटाबेस पर चलते हैं। कृपया अपने आधिकारिक खाते से साइन इन करें।'
                    : 'User lifecycle, SLA rules, and audit logs require an authenticated authority session backed by PostgreSQL.'
                  : loadError}
              </p>
            </div>
          </div>
          {!authUser && (
            <button
              type="button"
              onClick={onNavigateLogin}
              className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#FF6A2A]" />
              <span>{isHi ? 'अधिकारी साइन इन' : 'Authority Sign In'}</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 1: AUTHORITY USERS */}
      {subTab === 'users' && !authRequired && (
        <div className="space-y-6">
          {latestActivationLink && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-bold text-emerald-900 block">
                  {isHi ? 'सक्रियण लिंक तैयार है (48 घंटे वैध):' : 'Account Activation Link Ready (valid 48h):'}
                </span>
                <code className="text-[11px] font-mono text-emerald-800 break-all">{latestActivationLink}</code>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(latestActivationLink);
                  toast.success(isHi ? 'लिंक कॉपी हो गया!' : 'Link copied!');
                }}
                className="bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> {isHi ? 'कॉपी करें' : 'Copy'}
              </button>
            </div>
          )}

          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F1B2D] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#F4511E]" />
              {isHi ? 'नया अधिकारी / एडमिन खाता बनाएँ' : 'Provision New Authority Account'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                placeholder={isHi ? 'पूरा नाम' : 'Full Name'}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              />
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@samadhan.gov.in"
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              />
              <select
                required
                value={newUser.roleId}
                onChange={(e) => setNewUser((p) => ({ ...p, roleId: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">{isHi ? '-- भूमिका चुनें --' : '-- Select Role --'}</option>
                {org.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.scope})
                  </option>
                ))}
              </select>
              <select
                value={newUser.departmentId}
                onChange={(e) => setNewUser((p) => ({ ...p, departmentId: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">{isHi ? 'सभी विभाग' : 'All Departments'}</option>
                {org.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider"
              >
                {isHi ? 'खाता बनाएँ' : 'Create User'}
              </button>
            </div>
          </form>

          {/* Users Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">{isHi ? 'नाम / ईमेल' : 'Name / Email'}</th>
                    <th className="py-3 px-4">{isHi ? 'भूमिका व दायरा' : 'Role & Scope'}</th>
                    <th className="py-3 px-4">{isHi ? 'विभाग / वार्ड' : 'Department / Ward'}</th>
                    <th className="py-3 px-4">{isHi ? 'स्थिति' : 'Status'}</th>
                    <th className="py-3 px-4">2FA</th>
                    <th className="py-3 px-4 text-right">{isHi ? 'कार्रवाई' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isHi ? 'कोई अधिकारी खाता नहीं मिला।' : 'No authority accounts loaded.'}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0F172A]">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {u.role.name} <span className="text-[10px] text-slate-400">({u.role.scope})</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.department?.name || (isHi ? 'जिला स्तर' : 'District-wide')}
                          {u.ward ? ` · Ward ${u.ward.number}` : ''}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : u.status === 'PENDING_ACTIVATION'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.totpEnabled ? (
                            <span className="text-emerald-700 font-bold">ON</span>
                          ) : (
                            <span className="text-slate-400">OFF</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {u.status === 'PENDING_ACTIVATION' && (
                            <button
                              type="button"
                              onClick={() => void handleResendInvite(u)}
                              className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold"
                            >
                              {isHi ? 'लिंक भेजें' : 'Resend Link'}
                            </button>
                          )}
                          {u.status !== 'PENDING_ACTIVATION' && (
                            <button
                              type="button"
                              onClick={() => void handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                u.status === 'SUSPENDED'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {u.status === 'SUSPENDED' ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              {u.status === 'SUSPENDED'
                                ? isHi
                                  ? 'सक्रिय करें'
                                  : 'Activate'
                                : isHi
                                ? 'निलंबित करें'
                                : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLA & ESCALATION RULES */}
      {subTab === 'rules' && !authRequired && (
        <div className="space-y-6">
          <form onSubmit={handleUpsertRule} className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F1B2D] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#F4511E]" />
              {isHi ? 'SLA एस्केलेशन नियम जोड़ें या अपडेट करें' : 'Add or Update SLA Escalation Rule'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <select
                value={newRule.departmentId}
                onChange={(e) => setNewRule((p) => ({ ...p, departmentId: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">{isHi ? 'वैश्विक (सभी विभाग)' : 'Global (All Depts)'}</option>
                {org.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={newRule.priority}
                onChange={(e) => setNewRule((p) => ({ ...p, priority: e.target.value as any }))}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">{isHi ? 'सभी प्राथमिकताएँ' : 'All Priorities'}</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <input
                type="number"
                min={1}
                max={4}
                value={newRule.fromLevelOrder}
                onChange={(e) => setNewRule((p) => ({ ...p, fromLevelOrder: Number(e.target.value) }))}
                placeholder={isHi ? 'से स्तर' : 'From Level'}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              />
              <input
                type="number"
                min={2}
                max={4}
                value={newRule.toLevelOrder}
                onChange={(e) => setNewRule((p) => ({ ...p, toLevelOrder: Number(e.target.value) }))}
                placeholder={isHi ? 'तक स्तर' : 'To Level'}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              />
              <input
                type="number"
                min={1}
                value={newRule.slaHours}
                onChange={(e) => setNewRule((p) => ({ ...p, slaHours: Number(e.target.value) }))}
                placeholder={isHi ? 'SLA घंटे' : 'SLA Hours'}
                className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              />
              <button
                type="submit"
                className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider"
              >
                {isHi ? 'नियम सहेजें' : 'Save Rule'}
              </button>
            </div>
          </form>

          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">{isHi ? 'विभाग' : 'Department'}</th>
                    <th className="py-3 px-4">{isHi ? 'प्राथमिकता' : 'Priority'}</th>
                    <th className="py-3 px-4">{isHi ? 'एस्केलेशन पथ' : 'Escalation Path'}</th>
                    <th className="py-3 px-4">{isHi ? 'SLA घंटे' : 'SLA Hours'}</th>
                    <th className="py-3 px-4">{isHi ? 'स्थिति' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{isHi ? 'कार्रवाई' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isHi ? 'कोई SLA नियम लोड नहीं हुआ।' : 'No escalation rules loaded.'}
                      </td>
                    </tr>
                  ) : (
                    rules.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold">{r.department?.name || (isHi ? 'वैश्विक डिफ़ॉल्ट' : 'Global Default')}</td>
                        <td className="py-3 px-4 font-mono">{r.priority || 'ANY'}</td>
                        <td className="py-3 px-4 font-bold">
                          Level {r.fromLevelOrder} → Level {r.toLevelOrder}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#F4511E]">{r.slaHours}h</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {r.active ? (isHi ? 'सक्रिय' : 'ACTIVE') : isHi ? 'निष्क्रिय' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.active && (
                            <button
                              type="button"
                              onClick={() => void handleDeactivateRule(r.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title={isHi ? 'निष्क्रिय करें' : 'Deactivate'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM SETTINGS */}
      {subTab === 'settings' && !authRequired && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.keys(settings).length === 0 ? (
            <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-slate-400">
              {isHi ? 'कोई सिस्टम सेटिंग लोड नहीं हुई।' : 'No system settings loaded.'}
            </div>
          ) : (
            Object.entries(settings).map(([groupKey, groupObj]) => (
              <div key={groupKey} className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F1B2D]">
                    {groupKey}
                  </h4>
                  <button
                    type="button"
                    onClick={() => void handleSaveSettingGroup(groupKey)}
                    className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-3 py-1 rounded text-[10px] font-bold uppercase"
                  >
                    {isHi ? 'सहेजें' : 'Save'}
                  </button>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(groupObj).map(([fieldKey, fieldVal]) => (
                    <div key={fieldKey} className="flex items-center justify-between gap-4">
                      <label className="text-xs font-mono text-slate-600">{fieldKey}</label>
                      <input
                        type="number"
                        value={fieldVal}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            [groupKey]: {
                              ...prev[groupKey],
                              [fieldKey]: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-28 px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg font-mono text-xs text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {subTab === 'audit' && !authRequired && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-wrap gap-3 items-center shadow-xs">
            <select
              value={auditActorFilter}
              onChange={(e) => setAuditActorFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
            >
              <option value="">{isHi ? 'सभी कर्ता प्रकार' : 'All Actor Types'}</option>
              <option value="CITIZEN">CITIZEN</option>
              <option value="AUTHORITY">AUTHORITY</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
            <input
              type="text"
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              placeholder={isHi ? 'कार्रवाई फ़िल्टर करें (जैसे STATUS_CHANGED)' : 'Filter action (e.g. STATUS_CHANGED)'}
              className="flex-1 min-w-[200px] px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={() => void loadAudit()}
              className="bg-[#0F1B2D] text-white px-4 py-1.5 rounded-lg font-bold text-xs"
            >
              {isHi ? 'लागू करें' : 'Apply'}
            </button>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">{isHi ? 'समय' : 'Timestamp'}</th>
                    <th className="py-3 px-4">{isHi ? 'कर्ता' : 'Actor'}</th>
                    <th className="py-3 px-4">{isHi ? 'कार्रवाई' : 'Action'}</th>
                    <th className="py-3 px-4">{isHi ? 'इकाई / टिकट' : 'Entity / Ticket'}</th>
                    <th className="py-3 px-4">{isHi ? 'मेटाडेटा' : 'Metadata'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {isHi ? 'कोई ऑडिट लॉग प्रविष्टि नहीं मिली।' : 'No audit log entries found.'}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString(isHi ? 'hi-IN' : 'en-IN')}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {log.actorType}
                          {log.actorRole ? ` (${log.actorRole})` : ''}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#0F1B2D]">{log.action}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {log.entity || 'Ticket'}: {log.ticketId || log.entityId || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
