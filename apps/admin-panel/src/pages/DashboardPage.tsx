// src/pages/DashboardPage.tsx
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Newspaper, Users, Zap, CheckCircle, Plus, Bell, Loader2, ArrowRight, TrendingUp } from 'lucide-react';
import ArticleStatusBadge from '../components/ArticleStatusBadge';
import { useStats } from '../hooks/useStats';
import { useArticles } from '../hooks/useArticles';
import { format } from 'date-fns';

const WEEKLY_MOCK = [
  { day: 'Mon', count: 0 },
  { day: 'Tue', count: 0 },
  { day: 'Wed', count: 0 },
  { day: 'Thu', count: 0 },
  { day: 'Fri', count: 0 },
  { day: 'Sat', count: 0 },
  { day: 'Sun', count: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-ink-900 text-white text-xs px-3 py-2 rounded shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-gray-300">{payload[0].value} articles</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: statsData, isLoading: statsLoading } = useStats();
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ limit: 5 });

  const stats = statsData?.data;
  const recentArticles = articlesData?.data?.slice(0, 5) ?? [];

  const statCards = [
    {
      label: 'Total Articles',
      value: stats?.totalArticles ?? 0,
      icon: Newspaper,
      iconBg: 'bg-ink-800',
      iconColor: 'text-gray-300',
      sub: stats?.todayArticles ? `+${stats.todayArticles} today` : null,
    },
    {
      label: 'Published',
      value: stats?.publishedArticles ?? 0,
      icon: CheckCircle,
      iconBg: 'bg-status-green-bg',
      iconColor: 'text-status-green',
      sub: 'Live articles',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      sub: stats?.todayUsers ? `+${stats.todayUsers} today` : null,
    },
    {
      label: 'Breaking News',
      value: stats?.breakingCount ?? 0,
      icon: Zap,
      iconBg: 'bg-red/10',
      iconColor: 'text-red',
      sub: 'Active alerts',
    },
  ];

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card card-body h-24 animate-pulse bg-gray-100" />
            ))
          : statCards.map(({ label, value, icon: Icon, iconBg, iconColor, sub }) => (
              <div key={label} className="card card-body flex items-start gap-4">
                <div className={`stat-icon ${iconBg}`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <div>
                  <p className="stat-label">{label}</p>
                  <p className="stat-value">{value.toLocaleString()}</p>
                  {sub && <p className="text-2xs text-text-muted mt-1">{sub}</p>}
                </div>
              </div>
            ))
        }
      </div>

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <div className="card xl:col-span-2">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-text-muted" />
              <span className="section-title">Weekly Article Trend</span>
            </div>
            <span className="text-2xs text-text-muted">Last 7 days</span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={WEEKLY_MOCK} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E4E6EA" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F2F3F5' }} />
                <Bar dataKey="count" fill="#CC1F2D" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="p-4 space-y-2">
            <button onClick={() => navigate('/articles/new')} className="btn-primary w-full justify-center">
              <Plus size={15} /> New Article
            </button>
            <button onClick={() => navigate('/notifications')} className="btn-secondary w-full justify-center">
              <Bell size={15} /> Send Notification
            </button>
          </div>
          <div className="px-4 pb-4 pt-2">
            <div className="bg-page rounded border border-border divide-y divide-border">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-text-secondary">Today's Articles</span>
                <span className="text-sm font-semibold text-text-primary">{stats?.todayArticles ?? 0}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-text-secondary">Today's Users</span>
                <span className="text-sm font-semibold text-text-primary">{stats?.todayUsers ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent articles */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Recent Articles</span>
          <button
            onClick={() => navigate('/articles')}
            className="flex items-center gap-1 text-xs text-red hover:underline font-medium"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {articlesLoading ? (
          <div className="flex items-center justify-center h-28">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : recentArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-text-muted">
            <Newspaper size={28} className="mb-2" />
            <p className="text-sm">No articles yet — create the first one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Title</th>
                  <th className="th">Category</th>
                  <th className="th">Status</th>
                  <th className="th">Published</th>
                </tr>
              </thead>
              <tbody>
                {recentArticles.map((article) => (
                  <tr key={article.id} className="tr-hover cursor-pointer" onClick={() => navigate(`/articles/${article.id}/edit`)}>
                    <td className="td max-w-xs">
                      <p className="font-medium text-text-primary truncate">{article.titleTa}</p>
                      <p className="text-2xs text-text-muted truncate mt-0.5">{article.titleEn}</p>
                    </td>
                    <td className="td">
                      <span className="badge badge-gray">{article.category?.nameEn}</span>
                    </td>
                    <td className="td">
                      <ArticleStatusBadge status={article.status} />
                    </td>
                    <td className="td text-text-muted text-xs whitespace-nowrap">
                      {article.publishedAt
                        ? format(new Date(article.publishedAt), 'dd MMM yyyy')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
