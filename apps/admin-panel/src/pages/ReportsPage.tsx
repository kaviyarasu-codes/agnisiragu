// src/pages/ReportsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Newspaper, Download, Loader2, Calendar,
  BarChart2, PieChart as PieIcon, FileText, FileSpreadsheet,
  User, UsersRound, Star, Megaphone, ChevronDown, ChevronRight,
  Eye, MousePointerClick, ArrowUpRight, Shield, Radio,
  CheckCircle, Clock, AlertCircle, Activity,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { apiGet } from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type ReportType = 'overall' | 'team' | 'member' | 'reporter' | 'ads';
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ─── Constants ───────────────────────────────────────────────────────────────

const REPORT_TABS: { id: ReportType; label: string; icon: React.ReactNode }[] = [
  { id: 'overall',  label: 'Overall',       icon: <BarChart2 size={14} /> },
  { id: 'team',     label: 'Team',          icon: <UsersRound size={14} /> },
  { id: 'member',   label: 'Members',       icon: <User size={14} /> },
  { id: 'reporter', label: 'Reporters',     icon: <Radio size={14} /> },
  { id: 'ads',      label: 'Ads Team',      icon: <Megaphone size={14} /> },
];

const PIE_COLORS = ['#CC1F2D', '#1E3A5F', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#DB2777', '#059669'];

const PERIODS: { value: Period; label: string }[] = [
  { value: 'daily',   label: 'Last 7 Days' },
  { value: 'weekly',  label: 'Last 8 Weeks' },
  { value: 'monthly', label: 'Last 12 Months' },
  { value: 'yearly',  label: 'Last 5 Years' },
];

const TEAM_LABELS: Record<string, string> = {
  EDITOR_TEAM:                'Editor Team',
  VERIFICATION_TEAM:          'Verification Team',
  REPORTER_APP_TEAM:          'Reporter App Team',
  REPORTERS_MANAGEMENT_TEAM:  'Reporters Management',
  ADVERTISEMENT_TEAM:         'Advertisement Team',
  LOCAL_ADS_TEAM:             'Local Ads Team',
  ADMOB_TEAM:                 'AdMob Team',
  UNASSIGNED:                 'Unassigned',
};

const ROLE_LABELS: Record<string, string> = {
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

// ─── Export Utilities ─────────────────────────────────────────────────────────

function downloadCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h] ?? '';
        return typeof v === 'string' && (v.includes(',') || v.includes('"'))
          ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
}

async function downloadExcel(rows: Record<string, any>[], filename: string) {
  try {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  } catch {
    alert('Excel export failed. Run npm install in admin-panel first.');
  }
}

function printPDF(title: string) {
  const originalTitle = document.title;
  document.title = `${title} — ${format(new Date(), 'yyyy-MM-dd')}`;
  window.print();
  document.title = originalTitle;
}

// ─── Shared Components ────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-900 text-white text-xs px-3 py-2 rounded shadow-lg space-y-1">
      <p className="font-semibold text-gray-200">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{Number(p.value).toLocaleString()}</span></p>
      ))}
    </div>
  );
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-700 bg-green-50 border-green-200'
    : score >= 50 ? 'text-blue-700 bg-blue-50 border-blue-200'
    : score >= 20 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-gray-600 bg-gray-100 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full border font-bold ${color}`}>
      <Star size={9} className="fill-current" /> {score}
    </span>
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

function ExportBar({ onCSV, onExcel, onPDF, loading }: {
  onCSV: () => void; onExcel: () => void; onPDF: () => void; loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 size={14} className="animate-spin text-text-muted" />}
      <button onClick={onPDF}   className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
        <FileText size={13} /> PDF
      </button>
      <button onClick={onExcel} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
        <FileSpreadsheet size={13} /> Excel
      </button>
      <button onClick={onCSV}   className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
        <Download size={13} /> CSV
      </button>
    </div>
  );
}

function DateRangePicker({ from, to, onChange }: {
  from: string; to: string;
  onChange: (f: string, t: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Calendar size={13} className="text-text-muted" />
        <span className="text-xs text-text-muted">From</span>
        <input type="date" value={from} onChange={e => onChange(e.target.value, to)}
          className="input-field text-xs py-1.5 px-2 w-36" />
      </div>
      <span className="text-text-muted text-xs">—</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted">To</span>
        <input type="date" value={to} onChange={e => onChange(from, e.target.value)}
          className="input-field text-xs py-1.5 px-2 w-36" />
      </div>
    </div>
  );
}

// ─── Overall Report ───────────────────────────────────────────────────────────

function OverallReport({ from, to }: { from: string; to: string }) {
  const [period, setPeriod] = useState<Period>('monthly');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['reports-overall', period],
    queryFn: () => apiGet<{ data: any }>(`/admin/reports?period=${period}`),
  });
  const { data: catData } = useQuery({
    queryKey: ['reports-categories'],
    queryFn: () => apiGet<{ data: any[] }>('/admin/reports/categories'),
  });

  const trend = statsData?.data?.trend ?? [];
  const summary = statsData?.data?.summary ?? { totalArticles: 0, totalUsers: 0, totalReads: 0, avgPerDay: 0 };
  const cats = catData?.data ?? [];

  const exportRows = trend.map((t: any) => ({
    Period: t.label, Articles: t.articles, 'New Users': t.users,
  }));

  return (
    <div className="space-y-5 print-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-page border border-border rounded-lg p-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${period === p.value ? 'bg-red text-white shadow-sm' : 'text-text-secondary hover:bg-surface'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <ExportBar
          onCSV={() => downloadCSV(exportRows, 'overall_report')}
          onExcel={() => downloadExcel(exportRows, 'overall_report')}
          onPDF={() => printPDF('Overall Report')} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Published Articles" value={summary.totalArticles} icon={<Newspaper size={18} />} color="bg-red/10 text-red" sub="All time" />
        <MetricCard label="Total Users"        value={summary.totalUsers}    icon={<Users size={18} />}     color="bg-blue-50 text-blue-600" />
        <MetricCard label="Total Reads"        value={summary.totalReads}    icon={<Eye size={18} />}       color="bg-green-50 text-green-600" />
        <MetricCard label="Avg Articles/Day"   value={summary.avgPerDay}     icon={<Activity size={18} />}  color="bg-yellow-50 text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="card-header">
            <span className="section-title">Articles & Users Trend</span>
            <div className="flex items-center gap-1 bg-page border border-border rounded-lg p-1">
              <button onClick={() => setChartType('bar')} className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-red text-white' : 'text-text-muted'}`}><BarChart2 size={13} /></button>
              <button onClick={() => setChartType('line')} className={`p-1.5 rounded ${chartType === 'line' ? 'bg-red text-white' : 'text-text-muted'}`}><TrendingUp size={13} /></button>
            </div>
          </div>
          <div className="p-4">
            {isLoading ? <div className="h-52 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-text-muted" /></div> : (
              <ResponsiveContainer width="100%" height={220}>
                {chartType === 'bar' ? (
                  <BarChart data={trend} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#E4E6EA" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F2F3F5' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="articles" name="Articles"  fill="#CC1F2D" radius={[3,3,0,0]} maxBarSize={28} />
                    <Bar dataKey="users"    name="New Users" fill="#1E3A5F" radius={[3,3,0,0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <LineChart data={trend} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#E4E6EA" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="articles" name="Articles"  stroke="#CC1F2D" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="users"    name="New Users" stroke="#1E3A5F" strokeWidth={2} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="section-title">By Category</span></div>
          <div className="p-4">
            {cats.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-text-muted">
                <PieIcon size={28} className="mb-2 opacity-30" /><p className="text-xs">No data</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={cats} cx="50%" cy="50%" outerRadius={60} dataKey="count" nameKey="name">
                      {cats.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {cats.slice(0, 6).map((c: any, i: number) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-text-secondary truncate max-w-24">{c.name}</span>
                      </div>
                      <span className="font-semibold text-text-primary">{c.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Report ──────────────────────────────────────────────────────────────

function TeamReport({ from, to }: { from: string; to: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-teams', from, to],
    queryFn: () => apiGet<{ data: any[] }>(`/admin/reports/teams?dateFrom=${from}&dateTo=${to}`),
  });
  const teams = data?.data ?? [];

  const exportRows = teams.map((t: any) => ({
    Team: TEAM_LABELS[t.teamType] ?? t.teamType,
    Members: t.memberCount, Published: t.published,
    Drafts: t.drafts, Edits: t.edits, Logins: t.logins, 'Avg Score': t.score,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{teams.length} teams • {format(new Date(from), 'dd MMM yyyy')} – {format(new Date(to), 'dd MMM yyyy')}</p>
        <ExportBar
          onCSV={() => downloadCSV(exportRows, 'team_report')}
          onExcel={() => downloadExcel(exportRows, 'team_report')}
          onPDF={() => printPDF('Team Report')} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-text-muted" /></div>
      ) : teams.length === 0 ? (
        <div className="card card-body flex flex-col items-center justify-center h-40 text-text-muted">
          <UsersRound size={36} className="mb-3 opacity-20" /><p className="text-sm">No team data in this period</p>
        </div>
      ) : (
        <>
          {/* Summary bar chart */}
          <div className="card">
            <div className="card-header"><span className="section-title">Articles Published by Team</span></div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={teams.map((t: any) => ({ name: TEAM_LABELS[t.teamType] ?? t.teamType, published: t.published, edits: t.edits }))} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E4E6EA" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F2F3F5' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="published" name="Published" fill="#CC1F2D" radius={[3,3,0,0]} maxBarSize={32} />
                  <Bar dataKey="edits"     name="Edits"     fill="#1E3A5F" radius={[3,3,0,0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team rows */}
          <div className="space-y-3">
            {teams.map((team: any) => (
              <div key={team.teamType} className="card overflow-hidden">
                <button className="card-header w-full text-left" onClick={() => setExpanded(expanded === team.teamType ? null : team.teamType)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red/10 flex items-center justify-center flex-shrink-0">
                      <UsersRound size={16} className="text-red" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{TEAM_LABELS[team.teamType] ?? team.teamType}</p>
                      <p className="text-xs text-text-muted">{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-xs">
                      <span className="text-text-muted">Published: <span className="font-semibold text-text-primary">{team.published}</span></span>
                      <span className="text-text-muted">Edits: <span className="font-semibold text-text-primary">{team.edits}</span></span>
                      <span className="text-text-muted">Logins: <span className="font-semibold text-text-primary">{team.logins}</span></span>
                    </div>
                    <ScoreBadge score={team.score} />
                    {expanded === team.teamType ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
                  </div>
                </button>

                {expanded === team.teamType && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-page">
                        <tr>
                          {['Member','Role','Published','Drafts','Edits','Logins','Score'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left font-semibold text-text-muted">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {team.members.map((m: any) => (
                          <tr key={m.id} className="hover:bg-page">
                            <td className="px-4 py-2.5">
                              <div>
                                <p className="font-medium text-text-primary">{m.name}</p>
                                <p className="text-text-muted">{m.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-text-secondary">{ROLE_LABELS[m.adminRole] ?? m.adminRole}</td>
                            <td className="px-4 py-2.5 font-semibold text-text-primary">{m.published}</td>
                            <td className="px-4 py-2.5 text-text-secondary">{m.drafts}</td>
                            <td className="px-4 py-2.5 text-text-secondary">{m.edits}</td>
                            <td className="px-4 py-2.5 text-text-secondary">{m.logins}</td>
                            <td className="px-4 py-2.5"><ScoreBadge score={m.score} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Member Report ────────────────────────────────────────────────────────────

function MemberReport({ from, to }: { from: string; to: string }) {
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-members', from, to],
    queryFn: () => apiGet<{ data: any[] }>(`/admin/reports/members?dateFrom=${from}&dateTo=${to}`),
  });
  const members = data?.data ?? [];

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['reports-member-detail', selected, from, to],
    queryFn: () => apiGet<{ data: any }>(`/admin/reports/member/${selected}?dateFrom=${from}&dateTo=${to}`),
    enabled: !!selected,
  });
  const detail = detailData?.data;

  const exportRows = members.map((m: any) => ({
    Name: m.name, Email: m.email,
    Role: ROLE_LABELS[m.adminRole] ?? m.adminRole,
    Team: TEAM_LABELS[m.teamType ?? ''] ?? m.teamType ?? 'Unassigned',
    Published: m.published, Drafts: m.drafts, Edits: m.edits,
    Logins: m.logins, Score: m.score,
    'Last Login': m.lastLoginAt ? format(new Date(m.lastLoginAt), 'dd MMM yyyy HH:mm') : 'Never',
    Status: m.isActive ? 'Active' : 'Inactive',
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-text-muted">{members.length} members</p>
        <ExportBar
          onCSV={() => downloadCSV(exportRows, 'member_report')}
          onExcel={() => downloadExcel(exportRows, 'member_report')}
          onPDF={() => printPDF('Member Report')} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Member table */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="card-header"><span className="section-title">All Members</span></div>
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><Loader2 size={22} className="animate-spin text-text-muted" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-page">
                  <tr>
                    {['Member','Team','Published','Edits','Logins','Score',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No members found</td></tr>
                  ) : members.map((m: any) => (
                    <tr key={m.id} onClick={() => setSelected(m.id)}
                      className={`cursor-pointer transition-colors ${selected === m.id ? 'bg-red/5' : 'hover:bg-page'}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-red flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-2xs font-bold">{m.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{m.name}</p>
                            <p className="text-text-muted">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{TEAM_LABELS[m.teamType ?? ''] ?? '—'}</td>
                      <td className="px-4 py-2.5 font-semibold text-text-primary">{m.published}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{m.edits}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{m.logins}</td>
                      <td className="px-4 py-2.5"><ScoreBadge score={m.score} /></td>
                      <td className="px-4 py-2.5">
                        <ChevronRight size={13} className={selected === m.id ? 'text-red' : 'text-text-muted'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Member detail panel */}
        <div className="card">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-text-muted p-6">
              <User size={36} className="mb-3 opacity-20" />
              <p className="text-sm text-center">Select a member to view their detailed report</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 size={22} className="animate-spin text-text-muted" /></div>
          ) : detail ? (
            <div>
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{detail.admin.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{detail.admin.name}</p>
                    <p className="text-xs text-text-muted">{detail.admin.email}</p>
                    <p className="text-xs text-text-muted">{ROLE_LABELS[detail.admin.adminRole] ?? detail.admin.adminRole}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Published',    value: detail.metrics.published, icon: <CheckCircle size={12} />, color: 'text-green-600' },
                    { label: 'Drafts',       value: detail.metrics.drafts,    icon: <Clock size={12} />,       color: 'text-yellow-600' },
                    { label: 'Edits Made',   value: detail.metrics.edits,     icon: <Activity size={12} />,    color: 'text-blue-600' },
                    { label: 'Logins',       value: detail.metrics.logins,    icon: <Shield size={12} />,      color: 'text-purple-600' },
                  ].map(m => (
                    <div key={m.label} className="bg-page rounded-lg p-3 border border-border">
                      <div className={`flex items-center gap-1.5 mb-1 ${m.color}`}>{m.icon}<span className="text-2xs font-medium">{m.label}</span></div>
                      <p className="text-lg font-bold text-text-primary">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border">
                  <span className="text-xs text-text-muted">Performance Score</span>
                  <ScoreBadge score={detail.metrics.score} />
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-text-muted mb-2">Recent Articles</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {detail.articles.slice(0, 10).map((a: any) => (
                      <div key={a.id} className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-text-secondary truncate flex-1">{a.titleEn || 'Untitled'}</span>
                      </div>
                    ))}
                    {detail.articles.length === 0 && <p className="text-text-muted text-xs">No articles in this period</p>}
                  </div>
                </div>
                {detail.loginActivity.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-text-muted mb-2">Login Activity</p>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart data={detail.loginActivity} margin={{ left: -30 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                          tickFormatter={d => format(new Date(d), 'dd/MM')} />
                        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Bar dataKey="count" fill="#CC1F2D" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Reporter Report ──────────────────────────────────────────────────────────

function ReporterReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-reporters', from, to],
    queryFn: () => apiGet<{ data: any }>(`/admin/reports/members?dateFrom=${from}&dateTo=${to}`),
  });
  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiGet<{ data: any }>('/admin/stats'),
  });
  const stats = statsData?.data ?? {};

  const exportRows = [
    { Metric: 'Total Users',    Value: stats.totalUsers ?? 0 },
    { Metric: "Today's Users",  Value: stats.todayUsers ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">Reporter App user statistics</p>
        <ExportBar
          onCSV={() => downloadCSV(exportRows, 'reporter_report')}
          onExcel={() => downloadExcel(exportRows, 'reporter_report')}
          onPDF={() => printPDF('Reporter Report')} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Users"    value={stats.totalUsers ?? 0}    icon={<Users size={18} />}     color="bg-blue-50 text-blue-600"   sub="All time" />
        <MetricCard label="Today's Signups" value={stats.todayUsers ?? 0}   icon={<ArrowUpRight size={18} />} color="bg-green-50 text-green-600" sub="New today" />
        <MetricCard label="Active Reporters" value="—"                       icon={<Radio size={18} />}     color="bg-purple-50 text-purple-600" sub="After reporter app" />
        <MetricCard label="Press IDs Issued" value="—"                      icon={<Star size={18} />}      color="bg-yellow-50 text-yellow-600" sub="After reporter app" />
      </div>

      <div className="card card-body">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">Detailed Reporter Metrics — Coming with Reporter App</p>
            <p className="text-xs text-text-muted mt-1">
              Once the Reporter App is launched, this section will show: submissions per reporter,
              voice note counts, verification pass rate, reward points earned, streak tracking, and Press ID status.
              Basic user stats are available now from the reader app signups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ads Report ───────────────────────────────────────────────────────────────

function AdsReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-ads', from, to],
    queryFn: () => apiGet<{ data: any }>(`/admin/reports/ads?dateFrom=${from}&dateTo=${to}`),
  });
  const summary = data?.data?.summary ?? {};
  const ads: any[] = data?.data?.ads ?? [];

  const exportRows = ads.map(a => ({
    Title: a.title, Type: a.adType, Status: a.status,
    Placement: a.placement, Impressions: a.impressions ?? 0,
    Clicks: a.clickCount ?? 0,
    CTR: a.impressions ? `${((a.clickCount / a.impressions) * 100).toFixed(1)}%` : '0%',
    'Created By': a.admin?.name ?? '—',
    'Start Date': format(new Date(a.startDate), 'dd MMM yyyy'),
    'End Date':   format(new Date(a.endDate),   'dd MMM yyyy'),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">Local advertisement performance</p>
        <ExportBar
          onCSV={() => downloadCSV(exportRows, 'ads_report')}
          onExcel={() => downloadExcel(exportRows, 'ads_report')}
          onPDF={() => printPDF('Ads Report')} loading={isLoading} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard label="Total Ads"     value={summary.total ?? 0}            icon={<Megaphone size={18} />}         color="bg-pink-50 text-pink-600" />
        <MetricCard label="Active Ads"    value={summary.activeAds ?? 0}        icon={<CheckCircle size={18} />}       color="bg-green-50 text-green-600" />
        <MetricCard label="Impressions"   value={summary.totalImpressions ?? 0} icon={<Eye size={18} />}               color="bg-blue-50 text-blue-600" />
        <MetricCard label="Total Clicks"  value={summary.totalClicks ?? 0}      icon={<MousePointerClick size={18} />} color="bg-orange-50 text-orange-600" />
        <MetricCard label="Avg CTR"       value={`${summary.avgCtr ?? 0}%`}     icon={<TrendingUp size={18} />}        color="bg-purple-50 text-purple-600" />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header"><span className="section-title">Ad Performance Table</span></div>
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 size={22} className="animate-spin text-text-muted" /></div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-text-muted">
            <Megaphone size={28} className="mb-2 opacity-20" /><p className="text-sm">No ads in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-page">
                <tr>
                  {['Ad Title','Type','Status','Placement','Impressions','Clicks','CTR','Created By'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ads.map((a: any) => {
                  const ctr = a.impressions ? ((a.clickCount / a.impressions) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={a.id} className="hover:bg-page">
                      <td className="px-4 py-2.5 font-medium text-text-primary max-w-48 truncate">{a.title}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{a.adType}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-2xs px-2 py-0.5 rounded-full font-medium border ${
                          a.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                          a.status === 'PAUSED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{a.placement}</td>
                      <td className="px-4 py-2.5 font-semibold text-text-primary">{(a.impressions ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-semibold text-text-primary">{(a.clickCount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-bold ${Number(ctr) > 2 ? 'text-green-600' : 'text-text-secondary'}`}>{ctr}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{a.admin?.name ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const defaultFrom = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
const defaultTo   = format(new Date(), 'yyyy-MM-dd');

export default function ReportsPage() {
  const [activeTab, setActiveTab]   = useState<ReportType>('overall');
  const [dateFrom, setDateFrom]     = useState(defaultFrom);
  const [dateTo, setDateTo]         = useState(defaultTo);

  const handleDateChange = (f: string, t: string) => { setDateFrom(f); setDateTo(t); };

  return (
    <div className="space-y-5 print:space-y-3" id="reports-root">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="page-title flex items-center gap-2"><BarChart2 size={20} className="text-red" /> Reports</h1>
          <p className="text-sm text-text-muted mt-0.5">Performance analytics for teams, members, reporters and advertisements</p>
        </div>
        <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-page p-1 rounded-xl border border-border w-fit print:hidden">
        {REPORT_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-surface shadow text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Report content */}
      {activeTab === 'overall'  && <OverallReport  from={dateFrom} to={dateTo} />}
      {activeTab === 'team'     && <TeamReport     from={dateFrom} to={dateTo} />}
      {activeTab === 'member'   && <MemberReport   from={dateFrom} to={dateTo} />}
      {activeTab === 'reporter' && <ReporterReport from={dateFrom} to={dateTo} />}
      {activeTab === 'ads'      && <AdsReport      from={dateFrom} to={dateTo} />}
    </div>
  );
}
