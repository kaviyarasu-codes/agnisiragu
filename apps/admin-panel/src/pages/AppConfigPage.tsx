// src/pages/AppConfigPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ARCHITECTURE ONLY — Full implementation comes AFTER Reader App + Reporter App
// Backend: key-value store at /admin/app-config (already live)
// Each section is stubbed with its planned fields. Sections marked [LIVE] work now.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Smartphone, Palette, Type, LayoutGrid, Shield, Loader2,
  Moon, Sun, MonitorSmartphone, Lock, Unlock, ChevronRight,
  Megaphone, Bell, Image, Navigation, Layers, Flag, Tag,
  Sliders, Zap, Clock, BookOpen, Radio, Star, Package,
  Settings2, Eye, EyeOff, Tablet, CheckCircle2, CircleDashed,
} from 'lucide-react';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionStatus = 'live' | 'planned' | 'partial';

interface ConfigSection {
  id: string;
  label: string;
  labelTa: string;
  description: string;
  icon: React.ReactNode;
  status: SectionStatus;
  app: 'reader' | 'reporter' | 'both' | 'system';
  plannedFields: string[];
}

// ─── Section registry — the full planned architecture ────────────────────────

const SECTIONS: ConfigSection[] = [
  // ── Reader App ──────────────────────────────────────────────────────────
  {
    id: 'reader_identity',
    label: 'App Identity',
    labelTa: 'செயலி அடையாளம்',
    description: 'App name, logo, splash screen, app version',
    icon: <Smartphone size={16} />,
    status: 'partial',
    app: 'reader',
    plannedFields: ['App Name (Tamil)', 'App Name (English)', 'App Logo URL', 'Splash Screen URL', 'App Version', 'Play Store URL', 'App Store URL'],
  },
  {
    id: 'reader_theme',
    label: 'Theme & Colors',
    labelTa: 'தீம் & நிறங்கள்',
    description: 'Primary color, dark/light mode, accent colors',
    icon: <Palette size={16} />,
    status: 'partial',
    app: 'reader',
    plannedFields: ['Primary Color', 'Secondary Color', 'Accent Color', 'Default Theme (Light/Dark/System)', 'Allow User Theme Toggle', 'Status Bar Style'],
  },
  {
    id: 'reader_fonts',
    label: 'Typography & Fonts',
    labelTa: 'எழுத்துரு',
    description: 'Font family, size scale, Tamil font support',
    icon: <Type size={16} />,
    status: 'partial',
    app: 'reader',
    plannedFields: ['Font Family', 'Base Font Size', 'Tamil Font', 'Heading Weight', 'Article Line Height', 'Allow Reader Font Resize'],
  },
  {
    id: 'reader_home_layout',
    label: 'Home Layout',
    labelTa: 'முகப்பு அமைப்பு',
    description: 'Home screen widgets, section order, hero style',
    icon: <LayoutGrid size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['Hero Section Style (Slider/Single/Grid)', 'Visible Sections', 'Section Order (drag)', 'Breaking News Bar', 'Trending Ticker', 'Show Video Section', 'Show Local News Section'],
  },
  {
    id: 'reader_widgets',
    label: 'Widgets',
    labelTa: 'விஜெட்கள்',
    description: 'Individual home screen components and visibility',
    icon: <Layers size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['Breaking News Banner', 'Category Tabs', 'Trending Stories', 'Video Shorts Row', 'Local News Row', 'Weather Widget', 'Poll Widget', 'Top Reporters Widget'],
  },
  {
    id: 'reader_navigation',
    label: 'Bottom Navigation',
    labelTa: 'கீழ் வழிசெலுத்தல்',
    description: 'Tab bar items, icons, order, visibility',
    icon: <Navigation size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['Tab 1–5 Labels', 'Tab Icons', 'Tab Routes', 'Active Indicator Style', 'Show Labels', 'Max Tabs'],
  },
  {
    id: 'reader_menu',
    label: 'Side Menu',
    labelTa: 'பக்க மெனு',
    description: 'Drawer menu items and links',
    icon: <Sliders size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['Menu Items (label + route + icon)', 'Show User Profile', 'Show Saved Articles', 'Show Dark Mode Toggle', 'Show Language Switcher', 'Footer Links'],
  },
  {
    id: 'reader_news_sections',
    label: 'News Sections',
    labelTa: 'செய்தி பிரிவுகள்',
    description: 'Category visibility and ordering on home',
    icon: <BookOpen size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['Pinned Categories', 'Category Display Order', 'Max Articles Per Section', 'Show Section "See All" Button', 'Show Article Count Badge'],
  },
  {
    id: 'reader_ads',
    label: 'Advertisement Placement',
    labelTa: 'விளம்பர இடம்',
    description: 'Where ads appear, frequency, type (AdMob vs Local)',
    icon: <Megaphone size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['In-Feed Ad Frequency (every N articles)', 'Banner Ad Position', 'Interstitial Trigger (every N page opens)', 'Rewarded Ad Enable', 'Local Ad Ratio vs AdMob', 'Ad-Free Mode for Premium Users'],
  },
  {
    id: 'reader_notifications',
    label: 'Notifications',
    labelTa: 'அறிவிப்புகள்',
    description: 'Push notification channels and opt-in behavior',
    icon: <Bell size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['Default Notification Channels', 'Breaking News Alert Enable', 'Category Subscription Default', 'Notification Sound', 'Notification Grouping', 'Quiet Hours'],
  },
  {
    id: 'reader_splash',
    label: 'Splash Screen',
    labelTa: 'ஸ்பிளாஷ் திரை',
    description: 'Splash image, animation, duration',
    icon: <Image size={16} />,
    status: 'planned',
    app: 'reader',
    plannedFields: ['Splash Logo URL', 'Background Color', 'Animation Style', 'Duration (ms)', 'Show App Tagline', 'Tagline Text'],
  },

  // ── Reporter App ────────────────────────────────────────────────────────
  {
    id: 'reporter_identity',
    label: 'Reporter App Identity',
    labelTa: 'செய்தியாளர் செயலி',
    description: 'Reporter app name, logo, version',
    icon: <Radio size={16} />,
    status: 'planned',
    app: 'reporter',
    plannedFields: ['App Name (Tamil)', 'App Name (English)', 'App Logo URL', 'App Version', 'Play Store URL'],
  },
  {
    id: 'reporter_home',
    label: 'Reporter Home Layout',
    labelTa: 'செய்தியாளர் முகப்பு',
    description: 'Dashboard cards, quick actions, stats visible to reporters',
    icon: <LayoutGrid size={16} />,
    status: 'planned',
    app: 'reporter',
    plannedFields: ['Show Earnings Card', 'Show Submission Count', 'Show Rank Badge', 'Quick Actions (submit/voice/photo)', 'Show Leaderboard Preview'],
  },
  {
    id: 'reporter_navigation',
    label: 'Reporter Navigation',
    labelTa: 'செய்தியாளர் வழிசெலுத்தல்',
    description: 'Tab bar items for the reporter app',
    icon: <Navigation size={16} />,
    status: 'planned',
    app: 'reporter',
    plannedFields: ['Tab Items', 'Show Earnings Tab', 'Show Press ID Tab', 'Show Leaderboard Tab'],
  },
  {
    id: 'reporter_submission',
    label: 'Submission Settings',
    labelTa: 'சமர்ப்பிப்பு அமைப்புகள்',
    description: 'Voice note limits, photo limits, submission cooldowns',
    icon: <Zap size={16} />,
    status: 'planned',
    app: 'reporter',
    plannedFields: ['Max Voice Note Duration (seconds)', 'Max Photos Per Submission', 'Max Video Size (MB)', 'Submission Cooldown (minutes)', 'Auto-save Draft Enable', 'AI Transcription Enable'],
  },

  // ── System ──────────────────────────────────────────────────────────────
  {
    id: 'feature_flags',
    label: 'Feature Flags',
    labelTa: 'அம்ச கொடிகள்',
    description: 'Enable/disable platform features without redeployment',
    icon: <Flag size={16} />,
    status: 'partial',
    app: 'both',
    plannedFields: ['Login Gate (free article limit)', 'Breaking News Alerts', 'Maintenance Mode', 'Comments Enable', 'Polls Enable', 'Shorts/Video Enable', 'Reporter App Enable', 'Rewards Enable', 'Press ID Enable', 'AdMob Enable', 'Local Ads Enable'],
  },
  {
    id: 'app_version',
    label: 'App Version Control',
    labelTa: 'பதிப்பு கட்டுப்பாடு',
    description: 'Force update, minimum version, changelog',
    icon: <Package size={16} />,
    status: 'planned',
    app: 'both',
    plannedFields: ['Minimum Reader App Version', 'Minimum Reporter App Version', 'Force Update Enable', 'Update Message (Tamil)', 'Update Message (English)', 'Store URL Override'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const APP_TABS = [
  { id: 'all',      label: 'All Sections',   icon: <Settings2 size={14} /> },
  { id: 'reader',   label: 'Reader App',     icon: <Smartphone size={14} /> },
  { id: 'reporter', label: 'Reporter App',   icon: <Radio size={14} /> },
  { id: 'both',     label: 'System',         icon: <Sliders size={14} /> },
] as const;

const STATUS_CONFIG: Record<SectionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  live:    { label: 'Live',         color: 'bg-green-50 text-green-700 border-green-200',  icon: <CheckCircle2 size={10} /> },
  partial: { label: 'Partial',      color: 'bg-blue-50 text-blue-700 border-blue-200',    icon: <Eye size={10} /> },
  planned: { label: 'Coming Soon',  color: 'bg-gray-100 text-gray-500 border-gray-200',   icon: <CircleDashed size={10} /> },
};

const APP_COLOR: Record<string, string> = {
  reader:   'border-l-blue-400',
  reporter: 'border-l-purple-400',
  both:     'border-l-orange-400',
  system:   'border-l-gray-400',
};

function StatusBadge({ status }: { status: SectionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function SectionCard({ section, onClick }: { section: ConfigSection; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`card card-body text-left w-full hover:shadow-md transition-all border-l-4 ${APP_COLOR[section.app]} ${section.status === 'planned' ? 'opacity-70 hover:opacity-100' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${section.status === 'planned' ? 'bg-gray-100 text-gray-400' : 'bg-red/10 text-red'}`}>
            {section.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-text-primary">{section.label}</p>
              <StatusBadge status={section.status} />
            </div>
            <p className="text-xs text-text-muted mt-0.5">{section.labelTa}</p>
            <p className="text-xs text-text-secondary mt-1">{section.description}</p>
          </div>
        </div>
        <ChevronRight size={15} className="text-text-muted flex-shrink-0 mt-1" />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
        {section.plannedFields.slice(0, 4).map(f => (
          <span key={f} className="text-2xs px-2 py-0.5 rounded bg-page border border-border text-text-muted">
            {f}
          </span>
        ))}
        {section.plannedFields.length > 4 && (
          <span className="text-2xs px-2 py-0.5 rounded bg-page border border-border text-text-muted">
            +{section.plannedFields.length - 4} more
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Live: Basic App Identity form (the only fully-wired section for now) ────

function LiveIdentitySection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { appNameTa: 'அக்னிசிறகு', appNameEn: 'Agnisiragu', freeArticleLimit: 10 },
  });

  const cfg = data?.data ?? {};
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
    onError: () => toast.error('Save failed'),
  });

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <form onSubmit={handleSubmit(v => saveMut.mutate(v))} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="label">App Name (Tamil)</label>
        <input {...register('appNameTa')} defaultValue={cfg.appNameTa ?? 'அக்னிசிறகு'} className="input-field" />
      </div>
      <div>
        <label className="label">App Name (English)</label>
        <input {...register('appNameEn')} defaultValue={cfg.appNameEn ?? 'Agnisiragu'} className="input-field" />
      </div>
      <div>
        <label className="label">Free Article Limit</label>
        <div className="relative">
          <input {...register('freeArticleLimit')} type="number" min={1} max={50}
            defaultValue={cfg.freeArticleLimit ?? 10} className="input-field pr-20" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">articles</span>
        </div>
      </div>
      <div className="sm:col-span-3 flex justify-end">
        <button type="submit" disabled={saveMut.isPending} className="btn-primary">
          {saveMut.isPending && <Loader2 size={14} className="animate-spin" />} Save
        </button>
      </div>
    </form>
  );
}

// ─── Live: Feature Flags ──────────────────────────────────────────────────────

const FLAGS = [
  { key: 'loginGate',        label: 'Login Gate',           desc: 'Require login after free article limit', icon: <Lock size={14} /> },
  { key: 'breakingAlerts',   label: 'Breaking News Alerts', desc: 'Push alerts for breaking news',          icon: <Zap size={14} /> },
  { key: 'maintenanceMode',  label: 'Maintenance Mode',     desc: 'Show maintenance screen to all users',   icon: <EyeOff size={14} />, danger: true },
  { key: 'commentsEnable',   label: 'Comments',             desc: 'Reader article comment section',         icon: <Layers size={14} />, planned: true },
  { key: 'pollsEnable',      label: 'Polls',                desc: 'In-article poll widgets',                icon: <Star size={14} />, planned: true },
  { key: 'shortsEnable',     label: 'Video Shorts',         desc: 'Short video feed in reader app',         icon: <Radio size={14} />, planned: true },
  { key: 'rewardsEnable',    label: 'Reporter Rewards',     desc: 'Points and payout system',               icon: <Package size={14} />, planned: true },
  { key: 'pressIdEnable',    label: 'Press ID Cards',       desc: '30-day streak Press ID issuance',        icon: <Tag size={14} />, planned: true },
  { key: 'admobEnable',      label: 'AdMob Ads',            desc: 'Google AdMob advertisement',             icon: <Megaphone size={14} />, planned: true },
  { key: 'localAdsEnable',   label: 'Local Ads',            desc: 'Custom local business advertisements',   icon: <Megaphone size={14} />, planned: true },
] as const;

function LiveFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    loginGate: true, breakingAlerts: true, maintenanceMode: false,
  });
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Flag updated'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });

  const cfg = data?.data ?? {};
  const getFlag = (key: string) => cfg[key] ?? flags[key] ?? false;

  const toggle = (key: string) => {
    const next = !getFlag(key);
    setFlags(f => ({ ...f, [key]: next }));
    saveMut.mutate({ [key]: next });
  };

  return (
    <div className="divide-y divide-border">
      {FLAGS.map(f => (
        <div key={f.key}
          className={`flex items-center justify-between px-1 py-3 ${f.danger && getFlag(f.key) ? 'bg-red/5 rounded-lg px-3' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${f.danger ? 'bg-red/10 text-red' : 'bg-page text-text-muted'}`}>
              {f.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary">{f.label}</p>
                {'planned' in f && f.planned && (
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                    Planned
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">{f.desc}</p>
            </div>
          </div>
          <button type="button"
            disabled={'planned' in f && f.planned}
            onClick={() => !('planned' in f && f.planned) && toggle(f.key)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              getFlag(f.key) ? (f.danger ? 'bg-red' : 'bg-green-500') : 'bg-gray-200'
            } ${'planned' in f && f.planned ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${getFlag(f.key) ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Section Detail Drawer ────────────────────────────────────────────────────

function SectionDetail({ section, onClose }: { section: ConfigSection; onClose: () => void }) {
  const isLive = section.id === 'reader_identity' || section.id === 'feature_flags';
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="bg-surface h-full w-full max-w-lg shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-border sticky top-0 bg-surface z-10">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${section.status === 'planned' ? 'bg-gray-100 text-gray-400' : 'bg-red/10 text-red'}`}>
              {section.icon}
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{section.label}</h2>
              <p className="text-xs text-text-muted mt-0.5">{section.labelTa}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={section.status} />
            <button onClick={onClose} className="btn-ghost p-1.5 rounded ml-1">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <p className="text-sm text-text-secondary">{section.description}</p>

          {section.status === 'planned' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Planned — Not Yet Implemented</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This section will be configured after the Reader App and Reporter App mobile builds are complete.
                    The architecture and data keys are already reserved in the backend.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live content */}
          {section.id === 'reader_identity' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveIdentitySection />
            </div>
          )}
          {section.id === 'feature_flags' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Feature Flags</p>
              <LiveFeatureFlags />
            </div>
          )}

          {/* Planned fields list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
              {section.status === 'planned' ? 'Planned Fields' : 'All Fields'}
            </p>
            <div className="space-y-2">
              {section.plannedFields.map((field, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${section.status === 'planned' ? 'bg-page border-border' : 'bg-green-50/50 border-green-100'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${section.status === 'planned' ? 'bg-gray-100' : 'bg-green-100'}`}>
                    {section.status === 'planned'
                      ? <CircleDashed size={11} className="text-gray-400" />
                      : <CheckCircle2 size={11} className="text-green-600" />}
                  </div>
                  <p className="text-sm text-text-secondary">{field}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Backend key preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Backend Config Key</p>
            <code className="text-xs bg-ink-950 text-green-400 px-3 py-2 rounded-lg block font-mono">
              appConfig["{section.id}"] = {'{'} /* JSON object */ {'}'}
            </code>
            <p className="text-2xs text-text-muted mt-1.5">
              Stored in PostgreSQL <code className="font-mono">AppConfig</code> table as key-value.
              Reader/Reporter apps will fetch via <code className="font-mono">GET /config/{'{'}app{'}'}</code> (planned).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AppConfigPage() {
  const { admin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<ConfigSection | null>(null);

  if (admin?.adminRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={48} className="mb-3" />
        <p className="text-lg font-medium text-gray-600">Access Restricted</p>
        <p className="text-sm">Only Super Admins can configure the app.</p>
      </div>
    );
  }

  const filtered = SECTIONS.filter(s => activeTab === 'all' || s.app === activeTab);
  const liveSections    = filtered.filter(s => s.status === 'live');
  const partialSections = filtered.filter(s => s.status === 'partial');
  const plannedSections = filtered.filter(s => s.status === 'planned');

  const totalSections = SECTIONS.length;
  const liveCount     = SECTIONS.filter(s => s.status === 'live').length;
  const partialCount  = SECTIONS.filter(s => s.status === 'partial').length;
  const plannedCount  = SECTIONS.filter(s => s.status === 'planned').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Settings2 size={20} className="text-red" /> App Configuration
        </h1>
        <p className="text-sm text-text-muted mt-0.5">
          Dynamic configuration for Reader App, Reporter App, and platform settings
        </p>
      </div>

      {/* Architecture notice */}
      <div className="card card-body bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Architecture Phase — Full Implementation Pending</p>
            <p className="text-sm text-amber-700 mt-1">
              This module will be fully implemented <strong>after</strong> the Reader App and Reporter App are complete.
              The backend key-value store is already live. Sections marked <span className="font-semibold">Partial</span> are active now.
              <span className="font-semibold"> Coming Soon</span> sections are wired up structurally but not yet configurable.
            </p>
          </div>
        </div>
      </div>

      {/* Progress overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card card-body text-center border-l-4 border-l-green-400">
          <p className="stat-value text-2xl text-green-600">{liveCount + partialCount}</p>
          <p className="text-xs text-text-muted mt-1">Active Sections</p>
        </div>
        <div className="card card-body text-center border-l-4 border-l-amber-400">
          <p className="stat-value text-2xl text-amber-600">{plannedCount}</p>
          <p className="text-xs text-text-muted mt-1">Planned Sections</p>
        </div>
        <div className="card card-body text-center border-l-4 border-l-blue-400">
          <p className="stat-value text-2xl text-blue-600">{totalSections}</p>
          <p className="text-xs text-text-muted mt-1">Total Architecture</p>
        </div>
      </div>

      {/* App tabs */}
      <div className="flex gap-1 bg-page p-1 rounded-xl border border-border w-fit">
        {APP_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-surface shadow text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Active / Partial sections */}
      {[...liveSections, ...partialSections].length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
            <CheckCircle2 size={12} className="text-green-500" /> Active Now
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[...liveSections, ...partialSections].map(s => (
              <SectionCard key={s.id} section={s} onClick={() => setActiveSection(s)} />
            ))}
          </div>
        </div>
      )}

      {/* Planned sections */}
      {plannedSections.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
            <CircleDashed size={12} /> Coming After App Launch
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {plannedSections.map(s => (
              <SectionCard key={s.id} section={s} onClick={() => setActiveSection(s)} />
            ))}
          </div>
        </div>
      )}

      {/* Section drawer */}
      {activeSection && (
        <SectionDetail section={activeSection} onClose={() => setActiveSection(null)} />
      )}
    </div>
  );
}
