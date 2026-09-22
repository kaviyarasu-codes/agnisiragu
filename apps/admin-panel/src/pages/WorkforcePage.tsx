// src/pages/WorkforcePage.tsx
// Workforce module — attendance, active hours, and payroll for every team
// (Admin team, Editor Team, News Verification Team, Reporter App Team,
// Reporters Management Team, Advertisement/Local Ads/AdMob teams, and any
// team added later, since scoping is by teamType/adminRole not a hardcoded
// list). SUPER_ADMIN has full view+edit by default; the Access Control tab
// lets Super Admin grant that to a specific Admin or team Manager, scoped to
// their own team. Performance itself already lives in Reports — this page
// covers the pieces that didn't exist yet.
import { useState, Fragment } from 'react';
import {
  Loader2, Shield, Clock, CalendarCheck, Wallet, Lock,
  Users, CheckCircle2, XCircle, ChevronDown, ChevronRight, Save,
  Globe, Server, Receipt, Plus, Trash2, AlertTriangle,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import {
  useMyHrAccess, useDailyAttendance, useMonthlyAttendance, useMemberAttendanceDetail,
  useSalary, useUpsertSalary, useAccessGrants, useUpsertAccessGrant,
  useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense,
} from '../hooks/useHr';
import type { SalaryStatusValue, ExpenseTypeValue, RecurringExpense } from '../types';

// ─── Shared label maps (kept local — small, avoids coupling to ReportsPage) ──

const ROLE_LABELS: Record<string, string> = {
  ADMIN:                 'Admin',
  EDITOR_MANAGER:        'Editor Manager',
  EDITOR_MEMBER:         'Editor Member',
  VERIFICATION_MANAGER:  'Verification Manager',
  VERIFICATION_MEMBER:   'Fact Checker',
  REPORTER_APP_MANAGER:  'App Manager',
  REPORTER_APP_MEMBER:   'App Moderator',
  REPORTERS_MANAGER:     'Reporters Manager',
  REPORTERS_MEMBER:      'Support Member',
  ADVERTISEMENT_MANAGER: 'Ad Manager',
  LOCAL_ADS_MANAGER:     'Local Ads Manager',
  ADMOB_MANAGER:         'AdMob Manager',
};

const TEAM_LABELS: Record<string, string> = {
  EDITOR_TEAM:               'Editor Team',
  VERIFICATION_TEAM:         'Verification Team',
  REPORTER_APP_TEAM:         'Reporter App Team',
  REPORTERS_MANAGEMENT_TEAM: 'Reporters Mgmt',
  ADVERTISEMENT_TEAM:        'Advertisement',
  LOCAL_ADS_TEAM:            'Local Ads',
  ADMOB_TEAM:                'AdMob',
  SYSTEM:                    'System',
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function PersonCell({ name, adminRole, teamType, avatarUrl }: { name: string; adminRole: string; teamType?: string | null; avatarUrl?: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-red flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xs font-bold">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
        <p className="text-2xs text-text-muted truncate">
          {ROLE_LABELS[adminRole] ?? adminRole}{teamType ? ` · ${TEAM_LABELS[teamType] ?? teamType}` : ''}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card card-body flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        <p className="stat-value text-xl">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {sub && <p className="text-2xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Attendance tab ────────────────────────────────────────────────────────

function AttendanceTab() {
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [date, setDate] = useState(todayStr());
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expanded, setExpanded] = useState<string | null>(null);

  const daily = useDailyAttendance(date);
  const monthly = useMonthlyAttendance(month, year);
  const detail = useMemberAttendanceDetail(expanded, month, year);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-page border border-border rounded-lg p-1">
          <button onClick={() => setView('daily')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === 'daily' ? 'bg-surface shadow text-text-primary' : 'text-text-muted'}`}>
            Daily
          </button>
          <button onClick={() => setView('monthly')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === 'monthly' ? 'bg-surface shadow text-text-primary' : 'text-text-muted'}`}>
            Monthly
          </button>
        </div>

        {view === 'daily' ? (
          <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} className="input w-auto text-sm" />
        ) : (
          <div className="flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input w-auto text-sm">
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input w-auto text-sm">
              {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      {view === 'daily' ? (
        daily.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-red" /></div>
        ) : !daily.data?.data.length ? (
          <div className="card"><EmptyState icon={CalendarCheck} title="No one in scope yet" description="Team members will show up here once accounts exist." /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricCard label="Present Today" value={daily.data.data.filter((d) => d.present).length} icon={<CheckCircle2 size={18} />} color="bg-green-50 text-green-600" />
              <MetricCard label="Absent" value={daily.data.data.filter((d) => !d.present).length} icon={<XCircle size={18} />} color="bg-red/10 text-red" />
              <MetricCard label="Team Size" value={daily.data.data.length} icon={<Users size={18} />} color="bg-blue-50 text-blue-600" />
            </div>
            <div className="card p-0 overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="th">Member</th>
                  <th className="th">Status</th>
                  <th className="th">First Login</th>
                  <th className="th">Last Logout</th>
                  <th className="th">Total Hours</th>
                </tr></thead>
                <tbody>
                  {daily.data.data.map((d) => (
                    <tr key={d.id} className="tr-hover">
                      <td className="td"><PersonCell name={d.name} adminRole={d.adminRole} teamType={d.teamType} avatarUrl={d.avatarUrl} /></td>
                      <td className="td">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold ${d.present ? 'bg-green-50 text-green-700 border border-green-200' : 'badge-gray'}`}>
                          {d.present ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="td text-xs text-text-muted">{d.firstSeenAt ? new Date(d.firstSeenAt).toLocaleTimeString() : '—'}</td>
                      <td className="td text-xs text-text-muted">{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleTimeString() : '—'}</td>
                      <td className="td text-sm text-text-secondary">{d.present ? `${(d.activeMinutes / 60).toFixed(1)} hrs` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : monthly.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-red" /></div>
      ) : !monthly.data?.data.length ? (
        <div className="card"><EmptyState icon={CalendarCheck} title="No one in scope yet" /></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th"></th>
              <th className="th">Member</th>
              <th className="th">Days Present</th>
              <th className="th">Total Hours</th>
              <th className="th">Avg Hrs/Day</th>
              <th className="th">Attendance</th>
            </tr></thead>
            <tbody>
              {monthly.data.data.map((m) => (
                <Fragment key={m.id}>
                  <tr className="tr-hover cursor-pointer" onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                    <td className="td w-8">{expanded === m.id ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}</td>
                    <td className="td"><PersonCell name={m.name} adminRole={m.adminRole} teamType={m.teamType} avatarUrl={m.avatarUrl} /></td>
                    <td className="td text-sm text-text-secondary">{m.daysPresent} / {m.daysInMonth}</td>
                    <td className="td text-sm font-medium text-text-primary">{m.totalHours} hrs</td>
                    <td className="td text-sm text-text-secondary">{m.avgHoursPerPresentDay} hrs</td>
                    <td className="td">
                      <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${m.attendanceRate >= 80 ? 'text-green-700 bg-green-50 border-green-200' : m.attendanceRate >= 50 ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                        {m.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                  {expanded === m.id && (
                    <tr>
                      <td colSpan={6} className="bg-page px-4 py-3">
                        {detail.isLoading ? (
                          <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-red" /></div>
                        ) : !detail.data?.data.days.length ? (
                          <p className="text-xs text-text-muted text-center py-2">No activity recorded this month.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {detail.data.data.days.map((d) => (
                              <div key={d.date} title={`${d.date} — ${d.hours} hrs`}
                                className="text-2xs px-2 py-1 rounded bg-surface border border-border text-text-secondary">
                                {d.date.slice(8, 10)}: {d.hours}h
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Payment tab ───────────────────────────────────────────────────────────

function PaymentTab({ canEdit }: { canEdit: boolean }) {
  const [subView, setSubView] = useState<'salary' | 'renewals'>('salary');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-page border border-border rounded-lg p-1 w-fit">
        <button onClick={() => setSubView('salary')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${subView === 'salary' ? 'bg-surface shadow text-text-primary' : 'text-text-muted'}`}>
          Salary
        </button>
        <button onClick={() => setSubView('renewals')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${subView === 'renewals' ? 'bg-surface shadow text-text-primary' : 'text-text-muted'}`}>
          Domain & Server Renewals
        </button>
      </div>
      {subView === 'salary' ? <SalarySection canEdit={canEdit} /> : <RenewalsSection canEdit={canEdit} />}
    </div>
  );
}

function SalarySection({ canEdit }: { canEdit: boolean }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [drafts, setDrafts] = useState<Record<string, { amount: string; status: SalaryStatusValue; notes: string }>>({});

  const { data, isLoading } = useSalary(month, year);
  const upsert = useUpsertSalary();

  const draftFor = (adminId: string, fallback: { amount: number; status: SalaryStatusValue; notes?: string | null }) =>
    drafts[adminId] ?? { amount: String(fallback.amount), status: fallback.status, notes: fallback.notes ?? '' };

  const setDraft = (adminId: string, patch: Partial<{ amount: string; status: SalaryStatusValue; notes: string }>, fallback: { amount: number; status: SalaryStatusValue; notes?: string | null }) => {
    setDrafts((prev) => ({ ...prev, [adminId]: { ...draftFor(adminId, fallback), ...patch } }));
  };

  const save = (adminId: string) => {
    const d = drafts[adminId];
    if (!d) return;
    const amount = Number(d.amount);
    if (Number.isNaN(amount) || amount < 0) return;
    upsert.mutate({ adminId, month, year, amount, status: d.status, notes: d.notes || undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input w-auto text-sm">
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input w-auto text-sm">
          {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {!canEdit && (
          <span className="inline-flex items-center gap-1 text-2xs text-text-muted"><Lock size={11} /> View only</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-red" /></div>
      ) : !data?.data.length ? (
        <div className="card"><EmptyState icon={Wallet} title="No one in scope yet" /></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th">Member</th>
              <th className="th">Amount (₹)</th>
              <th className="th">Status</th>
              <th className="th">Notes</th>
              {canEdit && <th className="th"></th>}
            </tr></thead>
            <tbody>
              {data.data.map((s) => {
                const d = draftFor(s.id, s);
                const dirty = !!drafts[s.id];
                return (
                  <tr key={s.id} className="tr-hover">
                    <td className="td"><PersonCell name={s.name} adminRole={s.adminRole} teamType={s.teamType} avatarUrl={s.avatarUrl} /></td>
                    <td className="td">
                      {canEdit ? (
                        <input type="number" min={0} value={d.amount}
                          onChange={(e) => setDraft(s.id, { amount: e.target.value }, s)}
                          className="input w-28 text-sm" />
                      ) : (
                        <span className="text-sm text-text-primary font-medium">₹{s.amount.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="td">
                      {canEdit ? (
                        <select value={d.status} onChange={(e) => setDraft(s.id, { status: e.target.value as SalaryStatusValue }, s)} className="input w-auto text-xs">
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                        </select>
                      ) : (
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${s.status === 'PAID' ? 'bg-green-50 text-green-700 border border-green-200' : 'badge-gray'}`}>
                          {s.status === 'PAID' ? 'Paid' : 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className="td">
                      {canEdit ? (
                        <input type="text" value={d.notes} placeholder="Optional note"
                          onChange={(e) => setDraft(s.id, { notes: e.target.value }, s)}
                          className="input text-xs w-full min-w-[120px]" />
                      ) : (
                        <span className="text-xs text-text-muted">{s.notes || '—'}</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="td">
                        <button onClick={() => save(s.id)} disabled={!dirty || upsert.isPending}
                          className="btn-secondary text-2xs flex items-center gap-1 px-2 py-1 disabled:opacity-40">
                          <Save size={11} /> Save
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Renewals section (domain/server/other recurring costs) ───────────────

const EXPENSE_TYPE_META: Record<ExpenseTypeValue, { label: string; icon: React.ReactNode; color: string }> = {
  DOMAIN: { label: 'Domain', icon: <Globe size={12} />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  SERVER: { label: 'Server', icon: <Server size={12} />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  OTHER:  { label: 'Other',  icon: <Receipt size={12} />, color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

interface ExpenseDraft {
  name: string; type: ExpenseTypeValue; provider: string;
  amount: string; renewalDate: string; status: SalaryStatusValue; notes: string;
}

function expenseToDraft(e: RecurringExpense): ExpenseDraft {
  return {
    name: e.name, type: e.type, provider: e.provider ?? '',
    amount: String(e.amount), renewalDate: e.renewalDate.slice(0, 10),
    status: e.status, notes: e.notes ?? '',
  };
}

const BLANK_DRAFT: ExpenseDraft = { name: '', type: 'DOMAIN', provider: '', amount: '0', renewalDate: todayStr(), status: 'PENDING', notes: '' };

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(todayStr() + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function RenewalDueBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0) return <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded bg-red/10 text-red border border-red/20"><AlertTriangle size={10} /> Overdue</span>;
  if (days <= 30) return <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">Due in {days}d</span>;
  return <span className="text-2xs text-text-muted">in {days}d</span>;
}

function RenewalsSection({ canEdit }: { canEdit: boolean }) {
  const { data, isLoading } = useExpenses(true);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState<ExpenseDraft>(BLANK_DRAFT);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ExpenseDraft>(BLANK_DRAFT);

  const startEdit = (e: RecurringExpense) => { setEditId(e.id); setEditDraft(expenseToDraft(e)); };

  const submitAdd = () => {
    const amount = Number(addDraft.amount);
    if (!addDraft.name.trim() || Number.isNaN(amount) || amount < 0 || !addDraft.renewalDate) return;
    createExpense.mutate(
      { name: addDraft.name.trim(), type: addDraft.type, provider: addDraft.provider || undefined, amount, renewalDate: addDraft.renewalDate, status: addDraft.status, notes: addDraft.notes || undefined },
      { onSuccess: () => { setShowAdd(false); setAddDraft(BLANK_DRAFT); } },
    );
  };

  const submitEdit = (id: string) => {
    const amount = Number(editDraft.amount);
    if (!editDraft.name.trim() || Number.isNaN(amount) || amount < 0 || !editDraft.renewalDate) return;
    updateExpense.mutate(
      { id, name: editDraft.name.trim(), type: editDraft.type, provider: editDraft.provider || undefined, amount, renewalDate: editDraft.renewalDate, status: editDraft.status, notes: editDraft.notes || undefined },
      { onSuccess: () => setEditId(null) },
    );
  };

  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">Domain and server renewals, and any other recurring cost — org-wide, not tied to one person.</p>
        {canEdit && !showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn-secondary text-xs flex items-center gap-1 px-2.5 py-1.5">
            <Plus size={13} /> Add Renewal
          </button>
        )}
      </div>

      {showAdd && (
        <div className="card card-body space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input placeholder="e.g. agnisiragu.com" value={addDraft.name} onChange={(e) => setAddDraft((d) => ({ ...d, name: e.target.value }))} className="input text-sm col-span-2 sm:col-span-1" />
            <select value={addDraft.type} onChange={(e) => setAddDraft((d) => ({ ...d, type: e.target.value as ExpenseTypeValue }))} className="input text-sm">
              <option value="DOMAIN">Domain</option>
              <option value="SERVER">Server</option>
              <option value="OTHER">Other</option>
            </select>
            <input placeholder="Provider (optional)" value={addDraft.provider} onChange={(e) => setAddDraft((d) => ({ ...d, provider: e.target.value }))} className="input text-sm" />
            <input type="number" min={0} placeholder="Amount ₹" value={addDraft.amount} onChange={(e) => setAddDraft((d) => ({ ...d, amount: e.target.value }))} className="input text-sm" />
            <input type="date" value={addDraft.renewalDate} onChange={(e) => setAddDraft((d) => ({ ...d, renewalDate: e.target.value }))} className="input text-sm" />
            <select value={addDraft.status} onChange={(e) => setAddDraft((d) => ({ ...d, status: e.target.value as SalaryStatusValue }))} className="input text-sm">
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <input placeholder="Notes (optional)" value={addDraft.notes} onChange={(e) => setAddDraft((d) => ({ ...d, notes: e.target.value }))} className="input text-sm w-full" />
          <div className="flex gap-2">
            <button onClick={submitAdd} disabled={createExpense.isPending} className="btn-primary text-xs px-3 py-1.5">
              {createExpense.isPending && <Loader2 size={12} className="animate-spin" />} Save
            </button>
            <button onClick={() => { setShowAdd(false); setAddDraft(BLANK_DRAFT); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-red" /></div>
      ) : !rows.length ? (
        <div className="card"><EmptyState icon={Receipt} title="No renewals tracked yet" description={canEdit ? 'Add your first domain or server renewal above.' : undefined} /></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th">Item</th>
              <th className="th">Type</th>
              <th className="th">Provider</th>
              <th className="th">Amount (₹)</th>
              <th className="th">Renewal Date</th>
              <th className="th">Status</th>
              {canEdit && <th className="th"></th>}
            </tr></thead>
            <tbody>
              {rows.map((e) => {
                const isEditing = editId === e.id;
                const meta = EXPENSE_TYPE_META[e.type];
                if (isEditing) {
                  return (
                    <tr key={e.id} className="tr-hover bg-page">
                      <td className="td"><input value={editDraft.name} onChange={(ev) => setEditDraft((d) => ({ ...d, name: ev.target.value }))} className="input text-sm w-32" /></td>
                      <td className="td">
                        <select value={editDraft.type} onChange={(ev) => setEditDraft((d) => ({ ...d, type: ev.target.value as ExpenseTypeValue }))} className="input text-xs">
                          <option value="DOMAIN">Domain</option>
                          <option value="SERVER">Server</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </td>
                      <td className="td"><input value={editDraft.provider} onChange={(ev) => setEditDraft((d) => ({ ...d, provider: ev.target.value }))} className="input text-sm w-24" /></td>
                      <td className="td"><input type="number" min={0} value={editDraft.amount} onChange={(ev) => setEditDraft((d) => ({ ...d, amount: ev.target.value }))} className="input text-sm w-24" /></td>
                      <td className="td"><input type="date" value={editDraft.renewalDate} onChange={(ev) => setEditDraft((d) => ({ ...d, renewalDate: ev.target.value }))} className="input text-sm" /></td>
                      <td className="td">
                        <select value={editDraft.status} onChange={(ev) => setEditDraft((d) => ({ ...d, status: ev.target.value as SalaryStatusValue }))} className="input text-xs">
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                        </select>
                      </td>
                      <td className="td">
                        <div className="flex gap-1">
                          <button onClick={() => submitEdit(e.id)} disabled={updateExpense.isPending} className="btn-secondary text-2xs px-2 py-1"><Save size={11} /></button>
                          <button onClick={() => setEditId(null)} className="btn-secondary text-2xs px-2 py-1">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={e.id} className="tr-hover">
                    <td className="td">
                      <p className="text-sm font-medium text-text-primary">{e.name}</p>
                      {e.notes && <p className="text-2xs text-text-muted">{e.notes}</p>}
                    </td>
                    <td className="td"><span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded border ${meta.color}`}>{meta.icon} {meta.label}</span></td>
                    <td className="td text-xs text-text-secondary">{e.provider || '—'}</td>
                    <td className="td text-sm font-medium text-text-primary">₹{e.amount.toLocaleString()}</td>
                    <td className="td">
                      <p className="text-sm text-text-secondary">{e.renewalDate.slice(0, 10)}</p>
                      <RenewalDueBadge dateStr={e.renewalDate.slice(0, 10)} />
                    </td>
                    <td className="td">
                      <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${e.status === 'PAID' ? 'bg-green-50 text-green-700 border border-green-200' : 'badge-gray'}`}>
                        {e.status === 'PAID' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="td">
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(e)} className="btn-secondary text-2xs px-2 py-1">Edit</button>
                          <button onClick={() => deleteExpense.mutate(e.id)} disabled={deleteExpense.isPending} className="btn-secondary text-2xs px-2 py-1 text-status-red"><Trash2 size={11} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Access Control tab (SUPER_ADMIN only) ─────────────────────────────────

function AccessControlTab() {
  const { data, isLoading } = useAccessGrants(true);
  const upsert = useUpsertAccessGrant();

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted max-w-2xl">
        Off by default for everyone except Super Admin. Turning on "View" for an Admin lets them see every team's
        attendance, hours, and payment — the same as Reports. Turning it on for a Team Manager only shows their own
        team's members. "Edit" additionally lets them update payment records.
      </p>
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-red" /></div>
      ) : !data?.data.length ? (
        <div className="card"><EmptyState icon={Shield} title="No admins to grant access to yet" /></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="th">Member</th>
              <th className="th">View</th>
              <th className="th">Edit</th>
            </tr></thead>
            <tbody>
              {data.data.map((g) => (
                <tr key={g.id} className="tr-hover">
                  <td className="td"><PersonCell name={g.name} adminRole={g.adminRole} teamType={g.teamType} avatarUrl={g.avatarUrl} /></td>
                  <td className="td">
                    <input type="checkbox" checked={g.canView}
                      onChange={(e) => upsert.mutate({ adminId: g.id, canView: e.target.checked, canEdit: e.target.checked ? g.canEdit : false })}
                      className="w-4 h-4 accent-red cursor-pointer" />
                  </td>
                  <td className="td">
                    <input type="checkbox" checked={g.canEdit}
                      onChange={(e) => upsert.mutate({ adminId: g.id, canView: e.target.checked ? true : g.canView, canEdit: e.target.checked })}
                      className="w-4 h-4 accent-red cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

type WorkforceTab = 'attendance' | 'payment' | 'access';

export default function WorkforcePage() {
  const { data: accessData, isLoading } = useMyHrAccess();
  const [tab, setTab] = useState<WorkforceTab>('attendance');

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-red" /></div>;
  }

  const access = accessData?.data;
  const isSuperAdmin = access?.isSuperAdmin ?? false;
  const canView = isSuperAdmin || (access?.canView ?? false);
  const canEdit = isSuperAdmin || (access?.canEdit ?? false);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={48} className="mb-3" />
        <p className="text-lg font-medium text-gray-600">Access Restricted</p>
        <p className="text-sm mt-1">Ask a Super Admin to grant you Workforce access.</p>
      </div>
    );
  }

  const tabs: { id: WorkforceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'attendance', label: 'Attendance & Hours', icon: <Clock size={14} /> },
    { id: 'payment',    label: 'Payment',            icon: <Wallet size={14} /> },
    ...(isSuperAdmin ? [{ id: 'access' as WorkforceTab, label: 'Access Control', icon: <Shield size={14} /> }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-page border border-border rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-surface shadow text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'payment'    && <PaymentTab canEdit={canEdit} />}
      {tab === 'access'     && isSuperAdmin && <AccessControlTab />}
    </div>
  );
}
