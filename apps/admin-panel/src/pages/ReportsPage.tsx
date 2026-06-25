// src/pages/ReportsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Newspaper, Download, Loader2,
  Calendar, BarChart2, PieChart as PieIcon,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import { format, subDays, subMonths } from 'date-fns';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'daily',   label: 'Daily (Last 7 days)' },
  { value: 'weekly',  label: 'Weekly (Last 8 weeks)' },
  { value: 'monthly', label: 'Monthly (Last 12 months)' },
  { value: 'yearly',  label: 'Yearly (Last 5 years)' },
];

const PIE_COLORS = ['#CC1F2D', '#1E3A5F', '#16A34A', '#D97706', '#7C3AED', '#0891B2'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-ink-900 text-white text-xs px-3 py-2 rounded shadow-lg space-y-1">
        <p className="font-semibold text-gray-200">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

// Generate mock data for different periods
function generateArticleData(period: Period) {
  const now = new Date();
  if (period === 'daily') {
    return Array.from({ length: 7 }, (_, i) => ({
      label: format(subDays(now, 6 - i), 'EEE dd'),
      articles: 0, users: 0,
    }));
  }
  if (period === 'weekly') {
    return Array.from({ length: 8 }, (_, i) => ({
      label: `W${8 - i}`,
      articles: 0, users: 0,
    }));
  }
  if (period === 'monthly') {
    return Array.from({ length: 12 }, (_, i) => ({
      label: format(subMonths(now, 11 - i), 'MMM'),
      articles: 0, users: 0,
    }));
  }
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(new Date().getFullYear() - 4 + i),
    articles: 0, users: 0,
  }));
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [activeChart, setActiveChart] = useState<'bar' | 'line'>('bar');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['reports', period],
    queryFn: () => apiGet<{ data: any }>(`/admin/reports?period=${period}`),
  });

  const { data: categoryData } = useQuery({
    queryKey: ['reports-categories'],
    queryFn: () => apiGet<{ data: any[] }>('/admin/reports/categories'),
  });

  const trendData = statsData?.data?.trend ?? generateArticleData(period);
  const catBreakdown = categoryData?.data ?? [];
  const summary = statsData?.data?.summary ?? {
    totalArticles: 0, totalUsers: 0, totalReads: 0, avgPerDay: 0,
  };

  const summaryCards = [
    { label: 'Total Articles',    value: summary.totalArticles, icon: Newspaper,   color: 'bg-red/10 text-red' },
    { label: 'Total Users',       value: summary.totalUsers,    icon: Users,        color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Reads',       value: summary.totalReads,    icon: TrendingUp,   color: 'bg-green-50 text-green-600' },
    { label: 'Avg Articles/Day',  value: summary.avgPerDay,     icon: Calendar,     color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                period === p.value
                  ? 'bg-red text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-page'
              }`}
            >
              {p.value.charAt(0).toUpperCase() + p.value.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
            <button onClick={() => setActiveChart('bar')} className={`p-1.5 rounded ${activeChart === 'bar' ? 'bg-red text-white' : 'text-text-muted hover:text-text-primary'}`}>
              <BarChart2 size={14} />
            </button>
            <button onClick={() => setActiveChart('line')} className={`p-1.5 rounded ${activeChart === 'line' ? 'bg-red text-white' : 'text-text-muted hover:text-text-primary'}`}>
              <TrendingUp size={14} />
            </button>
          </div>
          <button className="btn-secondary text-xs">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card card-body flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="stat-label">{label}</p>
              <p className="stat-value">{Number(value ?? 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main chart + Category breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-text-muted" />
              <span className="section-title">Articles & Users Trend</span>
            </div>
            <span className="text-2xs text-text-muted capitalize">{PERIODS.find(p => p.value === period)?.label}</span>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="h-56 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-text-muted" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                {activeChart === 'bar' ? (
                  <BarChart data={trendData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#E4E6EA" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F2F3F5' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="articles" name="Articles" fill="#CC1F2D" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="users"    name="New Users" fill="#1E3A5F" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : (
                  <LineChart data={trendData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#E4E6EA" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="articles" name="Articles" stroke="#CC1F2D" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="users"    name="New Users" stroke="#1E3A5F" strokeWidth={2} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <PieIcon size={16} className="text-text-muted" />
              <span className="section-title">By Category</span>
            </div>
          </div>
          <div className="p-5">
            {catBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                <PieIcon size={32} className="mb-2 opacity-30" />
                <p className="text-xs">No data yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={catBreakdown} cx="50%" cy="50%" outerRadius={65} dataKey="count" nameKey="name">
                      {catBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {catBreakdown.slice(0, 5).map((c: any, i: number) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-text-secondary truncate max-w-[100px]">{c.name}</span>
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

      {/* Top articles table */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Top Articles by Reads</span>
          <span className="text-2xs text-text-muted capitalize">{period}</span>
        </div>
        <div className="flex flex-col items-center justify-center h-28 text-text-muted">
          <Newspaper size={28} className="mb-2 opacity-30" />
          <p className="text-sm">Article read analytics coming soon</p>
          <p className="text-xs mt-1">Add articles to start tracking reads</p>
        </div>
      </div>
    </div>
  );
}
