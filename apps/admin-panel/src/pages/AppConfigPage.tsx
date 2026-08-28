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
  Images, Plus, Trash2, Upload,
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
    status: 'live',
    app: 'reader',
    plannedFields: ['Hero Section Style (Slider/Single)', 'Breaking News Bar', 'Home Section Order'],
  },
  {
    id: 'reader_widgets',
    label: 'Widgets',
    labelTa: 'விஜெட்கள்',
    description: 'Individual home screen components and visibility',
    icon: <Layers size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Breaking News Banner', 'Category Tabs', 'Trending Stories', 'Video Shorts Row', 'Local News Row', 'Weather Widget', 'Poll Widget', 'Top Reporters Widget'],
  },
  {
    id: 'reader_navigation',
    label: 'Bottom Navigation',
    labelTa: 'கீழ் வழிசெலுத்தல்',
    description: 'Tab bar items, icons, order, visibility',
    icon: <Navigation size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Tab Labels (Tamil + English)', 'Tab Visibility', 'Show Labels'],
  },
  {
    id: 'reader_menu',
    label: 'Side Menu',
    labelTa: 'பக்க மெனு',
    description: 'Drawer menu items and links',
    icon: <Sliders size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Enable Side Menu', 'Show User Profile', 'Show Saved Articles', 'Show Dark Mode Toggle', 'Show Language Switcher', 'Show Contact Us'],
  },
  {
    id: 'reader_news_sections',
    label: 'News Sections',
    labelTa: 'செய்தி பிரிவுகள்',
    description: 'Category visibility and ordering on home',
    icon: <BookOpen size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Pinned Categories', 'Show Section "See All" Button', 'Max Articles Per Section', 'Show Article Count Badge'],
  },
  {
    id: 'reader_ads',
    label: 'Advertisement Placement',
    labelTa: 'விளம்பர இடம்',
    description: 'Where ads appear, frequency, type (AdMob vs Local)',
    icon: <Megaphone size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['In-Feed Ad Frequency (every N articles)', 'Local Ads Enable', 'Banner Ad Position', 'Interstitial Trigger (every N page opens)', 'Rewarded Ad Enable', 'AdMob Enable (needs SDK)'],
  },
  {
    id: 'reader_notifications',
    label: 'Notifications',
    labelTa: 'அறிவிப்புகள்',
    description: 'Push notification channels and opt-in behavior',
    icon: <Bell size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Breaking News Alert Enable', 'Auto-Push on Breaking Article', 'Default Notification Channels', 'Category Subscription Default', 'Notification Sound', 'Quiet Hours'],
  },
  {
    id: 'reader_splash',
    label: 'Splash Screen',
    labelTa: 'ஸ்பிளாஷ் திரை',
    description: 'Splash image, animation, duration',
    icon: <Image size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Background Color', 'Duration (ms)', 'Animation Style', 'Show App Tagline', 'Tagline Text (Tamil + English)', 'Splash Logo URL'],
  },
  {
    id: 'reader_rate_ticker',
    label: 'Rate Ticker',
    labelTa: 'விலை பட்டி',
    description: 'The gold/silver rate + sponsor credit strip shown under the Home feed',
    icon: <Tag size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Enable/Disable', 'Sponsor Name', 'Gold Rate', 'Silver Rate'],
  },
  {
    id: 'reader_onboarding',
    label: 'Onboarding Carousel',
    labelTa: 'அறிமுக ஸ்லைடுகள்',
    description: 'First-launch slides — image, Tamil + English title and description, shown before language/district setup',
    icon: <Images size={16} />,
    status: 'live',
    app: 'reader',
    plannedFields: ['Slide Image URL', 'Title (Tamil + English)', 'Description (Tamil + English)', 'Add / Remove Slides', 'Slide Order'],
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
  { key: 'admobEnable',      label: 'AdMob Ads',            desc: 'Google AdMob advertisement (needs native SDK build)', icon: <Megaphone size={14} />, planned: true },
  { key: 'localAdsEnable',   label: 'Local Ads',            desc: 'Custom local business advertisements — also in Advertisement Placement', icon: <Megaphone size={14} /> },
] as const;

function LiveFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    loginGate: true, breakingAlerts: true, maintenanceMode: false, localAdsEnable: true,
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
          className={`flex items-center justify-between px-1 py-3 ${'danger' in f && f.danger && getFlag(f.key) ? 'bg-red/5 rounded-lg px-3' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${'danger' in f && f.danger ? 'bg-red/10 text-red' : 'bg-page text-text-muted'}`}>
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
              getFlag(f.key) ? ('danger' in f && f.danger ? 'bg-red' : 'bg-green-500') : 'bg-gray-200'
            } ${'planned' in f && f.planned ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${getFlag(f.key) ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Live: Home Layout ─────────────────────────────────────────────────────────

const HOME_SECTIONS = [
  { key: 'breaking',   label: 'Breaking News' },
  { key: 'categories', label: 'Category Tabs' },
  { key: 'feed',       label: 'Article Feed' },
] as const;

function LiveHomeLayout() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
    onError: () => toast.error('Save failed'),
  });

  const cfg = data?.data ?? {};
  const heroStyle: 'slider' | 'single' = cfg.homeHeroStyle ?? 'slider';
  const showBreakingBar: boolean = cfg.homeShowBreakingBar ?? true;
  const order: string[] = cfg.homeSectionOrder ?? HOME_SECTIONS.map(s => s.key);

  const move = (key: string, dir: 'up' | 'down') => {
    const i = order.indexOf(key);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    saveMut.mutate({ homeSectionOrder: next });
  };

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Hero Section Style</label>
        <div className="inline-flex bg-page rounded-lg p-0.5 border border-border">
          {(['slider', 'single'] as const).map(s => (
            <button key={s} type="button"
              onClick={() => saveMut.mutate({ homeHeroStyle: s })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${heroStyle === s ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-text-primary">Breaking News Bar</p>
          <p className="text-xs text-text-muted">Show the breaking-news carousel on Home</p>
        </div>
        <button type="button" onClick={() => saveMut.mutate({ homeShowBreakingBar: !showBreakingBar })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${showBreakingBar ? 'bg-green-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showBreakingBar ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div>
        <label className="label">Home Section Order</label>
        <div className="space-y-1.5">
          {order.map((key, i) => {
            const meta = HOME_SECTIONS.find(s => s.key === key);
            if (!meta) return null;
            return (
              <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-page">
                <span className="text-sm text-text-primary">{i + 1}. {meta.label}</span>
                <div className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => move(key, 'up')} className="btn-ghost px-2 py-1 text-xs disabled:opacity-30">↑</button>
                  <button type="button" disabled={i === order.length - 1} onClick={() => move(key, 'down')} className="btn-ghost px-2 py-1 text-xs disabled:opacity-30">↓</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Live: Widgets ──────────────────────────────────────────────────────────────

const WIDGET_TOGGLES = [
  { key: 'widgetBreakingBanner', label: 'Breaking News Banner', live: true },
  { key: 'widgetCategoryTabs',   label: 'Category Tabs',        live: true },
  { key: 'widgetTrending',       label: 'Trending Stories',     live: false },
  { key: 'widgetVideoShorts',    label: 'Video Shorts Row',     live: false },
  { key: 'widgetLocalNews',      label: 'Local News Row',       live: false },
  { key: 'widgetWeather',        label: 'Weather Widget',       live: false },
  { key: 'widgetPoll',           label: 'Poll Widget',          live: false },
  { key: 'widgetTopReporters',   label: 'Top Reporters Widget', live: false },
] as const;

function LiveWidgets() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });
  const cfg = data?.data ?? {};

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="divide-y divide-border">
      {WIDGET_TOGGLES.map(w => {
        const val = cfg[w.key] ?? true;
        return (
          <div key={w.key} className="flex items-center justify-between px-1 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{w.label}</p>
              {!w.live && <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Planned</span>}
            </div>
            <button type="button" disabled={!w.live}
              onClick={() => w.live && saveMut.mutate({ [w.key]: !val })}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${val && w.live ? 'bg-green-500' : 'bg-gray-200'} ${!w.live ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${val && w.live ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Live: Bottom Navigation ──────────────────────────────────────────────────

const DEFAULT_NAV_TABS = [
  { key: 'home',       labelTa: 'முகப்பு',     labelEn: 'Home',       visible: true },
  { key: 'categories', labelTa: 'பிரிவுகள்',   labelEn: 'Categories', visible: true },
  { key: 'search',     labelTa: 'தேடல்',       labelEn: 'Search',     visible: true },
  { key: 'bookmarks',  labelTa: 'சேமிப்பு',    labelEn: 'Saved',      visible: true },
  { key: 'profile',    labelTa: 'சுயவிவரம்',   labelEn: 'Profile',    visible: true },
];

function LiveBottomNav() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });
  const cfg = data?.data ?? {};
  const tabs: typeof DEFAULT_NAV_TABS = cfg.navTabs ?? DEFAULT_NAV_TABS;
  const showLabels: boolean = cfg.navShowLabels ?? true;

  const toggleVisible = (key: string) => {
    const visibleCount = tabs.filter(t => t.visible).length;
    const target = tabs.find(t => t.key === key);
    if (target?.visible && visibleCount <= 2) {
      toast.error('At least 2 tabs must stay visible');
      return;
    }
    const next = tabs.map(t => t.key === key ? { ...t, visible: !t.visible } : t);
    saveMut.mutate({ navTabs: next });
  };

  const editLabel = (key: string, field: 'labelTa' | 'labelEn', value: string) => {
    const next = tabs.map(t => t.key === key ? { ...t, [field]: value } : t);
    saveMut.mutate({ navTabs: next });
  };

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <p className="text-sm font-medium text-text-primary">Show Tab Labels</p>
        <button type="button" onClick={() => saveMut.mutate({ navShowLabels: !showLabels })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${showLabels ? 'bg-green-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showLabels ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {tabs.map(tab => (
          <div key={tab.key} className="p-3 rounded-lg border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{tab.key}</span>
              <button type="button" onClick={() => toggleVisible(tab.key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${tab.visible ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tab.visible ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input defaultValue={tab.labelTa} onBlur={(e) => editLabel(tab.key, 'labelTa', e.target.value)}
                className="input-field h-8 text-xs" placeholder="Tamil label" />
              <input defaultValue={tab.labelEn} onBlur={(e) => editLabel(tab.key, 'labelEn', e.target.value)}
                className="input-field h-8 text-xs" placeholder="English label" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live: Side Menu ────────────────────────────────────────────────────────────

const SIDE_MENU_TOGGLES = [
  { key: 'sideMenuEnabled',         label: 'Enable Side Menu',        desc: 'Show the hamburger icon and slide-out panel' },
  { key: 'sideMenuShowProfile',     label: 'Show User Profile',       desc: 'Link to Profile screen' },
  { key: 'sideMenuShowBookmarks',   label: 'Show Saved Articles',     desc: 'Link to Bookmarks screen' },
  { key: 'sideMenuShowDarkMode',    label: 'Show Dark Mode Toggle',   desc: 'Quick theme switch' },
  { key: 'sideMenuShowLanguage',    label: 'Show Language Switcher',  desc: 'Quick Tamil/English switch' },
  { key: 'sideMenuShowContact',     label: 'Show Contact Us',         desc: 'Link to Contact screen' },
] as const;

function LiveSideMenu() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });
  const cfg = data?.data ?? {};

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="divide-y divide-border">
      {SIDE_MENU_TOGGLES.map(t => {
        const val = cfg[t.key] ?? true;
        return (
          <div key={t.key} className="flex items-center justify-between px-1 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">{t.label}</p>
              <p className="text-xs text-text-muted">{t.desc}</p>
            </div>
            <button type="button" onClick={() => saveMut.mutate({ [t.key]: !val })}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${val ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Live: News Sections ────────────────────────────────────────────────────────

function LiveNewsSections() {
  const qc = useQueryClient();
  const { data: cfgData, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const { data: catData } = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: () => apiGet<{ data: { id: string; nameTa: string; nameEn: string; slug: string }[] }>('/categories/admin/all'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });

  const cfg = cfgData?.data ?? {};
  const categories = catData?.data ?? [];
  const pinned: string[] = cfg.pinnedCategorySlugs ?? [];
  const showSeeAll: boolean = cfg.newsShowSeeAll ?? true;

  const togglePin = (slug: string) => {
    const next = pinned.includes(slug) ? pinned.filter(s => s !== slug) : [...pinned, slug];
    saveMut.mutate({ pinnedCategorySlugs: next });
  };

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-text-primary">Show "See All" Button</p>
          <p className="text-xs text-text-muted">On each home section header</p>
        </div>
        <button type="button" onClick={() => saveMut.mutate({ newsShowSeeAll: !showSeeAll })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${showSeeAll ? 'bg-green-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showSeeAll ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div>
        <label className="label">Pinned Categories (shown first, in this order)</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(c => {
            const isPinned = pinned.includes(c.slug);
            return (
              <button key={c.id} type="button" onClick={() => togglePin(c.slug)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isPinned ? 'bg-red/10 border-red/30 text-red font-medium' : 'border-border text-text-secondary hover:bg-page'}`}>
                {c.nameEn} {isPinned && `#${pinned.indexOf(c.slug) + 1}`}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-muted mt-2">Categories not pinned keep their normal display order.</p>
      </div>
    </div>
  );
}

// ─── Live: Advertisement Placement ───────────────────────────────────────────

const AD_PLANNED_TOGGLES = [
  { key: 'admobEnable', label: 'AdMob Enable', desc: 'Requires react-native-google-mobile-ads in a native build — not wired yet' },
] as const;

function LiveAdvertisement() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });
  const cfg = data?.data ?? {};
  const frequency: number = cfg.adInFeedFrequency ?? 5;
  const localAdsEnable: boolean = cfg.localAdsEnable ?? true;

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <label className="label">In-Feed Ad Frequency</label>
        <div className="relative mt-1 max-w-[180px]">
          <input type="number" min={2} max={20} defaultValue={frequency}
            onBlur={(e) => {
              const n = Math.max(2, Math.min(20, Number(e.target.value) || 5));
              saveMut.mutate({ adInFeedFrequency: n });
            }}
            className="input-field pr-24" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">articles</span>
        </div>
        <p className="text-xs text-text-muted mt-1.5">An ad card is inserted after every N articles in the Home feed.</p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-text-primary">Local Ads Enable</p>
          <p className="text-xs text-text-muted">Show ads created in Local Ads in the feed's ad slots</p>
        </div>
        <button type="button" onClick={() => saveMut.mutate({ localAdsEnable: !localAdsEnable })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${localAdsEnable ? 'bg-green-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${localAdsEnable ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="divide-y divide-border border border-border rounded-lg">
        {AD_PLANNED_TOGGLES.map(t => (
          <div key={t.key} className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{t.label}</p>
              <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Planned</span>
            </div>
            <button type="button" disabled className="relative w-11 h-6 rounded-full bg-gray-200 opacity-40 cursor-not-allowed flex-shrink-0">
              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        When Local Ads is off (or no active ad matches), the feed falls back to a placeholder AdMob slot — AdMob itself isn't wired to a real ad network yet.
      </p>
    </div>
  );
}

// ─── Live: Notifications ──────────────────────────────────────────────────────

function LiveNotifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });
  const cfg = data?.data ?? {};
  const breakingAlerts: boolean = cfg.breakingAlerts ?? true;

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-text-primary">Breaking News Alert Enable</p>
          <p className="text-xs text-text-muted">
            When on, marking an article as breaking (or publishing one already marked breaking) sends a push to every registered device — via Firebase Cloud Messaging.
          </p>
        </div>
        <button type="button" onClick={() => saveMut.mutate({ breakingAlerts: !breakingAlerts })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${breakingAlerts ? 'bg-green-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${breakingAlerts ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-800">
          Only reaches readers who are logged in and have granted notification permission (their device token is registered automatically). Guests and users who declined permission won't receive pushes.
        </p>
      </div>

      <div className="divide-y divide-border border border-border rounded-lg">
        {['Default Notification Channels', 'Category Subscription Default', 'Notification Sound', 'Quiet Hours'].map(f => (
          <div key={f} className="flex items-center justify-between px-3 py-3">
            <p className="text-sm font-medium text-text-primary">{f}</p>
            <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Planned</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live: Splash Screen ──────────────────────────────────────────────────────

function LiveSplash() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });
  const cfg = data?.data ?? {};
  const bgColor: string = cfg.splashBgColor ?? '#F5F1EB';
  const duration: number = cfg.splashDurationMs ?? 3400;
  const animation: 'wings' | 'fade' | 'none' = cfg.splashAnimation ?? 'wings';
  const showTagline: boolean = cfg.splashShowTagline ?? true;

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-5">
      <p className="text-xs text-text-muted">
        Controls the in-app splash shown right after the native launch screen, while the app finishes loading. It does not replace the OS-level launch image (that's baked into the build).
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Background Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" defaultValue={bgColor}
              onChange={(e) => saveMut.mutate({ splashBgColor: e.target.value })}
              className="w-9 h-9 rounded border border-border cursor-pointer" />
            <input defaultValue={bgColor} onBlur={(e) => saveMut.mutate({ splashBgColor: e.target.value })}
              className="input-field h-9 text-xs font-mono" />
          </div>
        </div>
        <div>
          <label className="label">Duration (ms)</label>
          <input type="number" min={400} max={4000} step={100} defaultValue={duration}
            onBlur={(e) => saveMut.mutate({ splashDurationMs: Math.max(400, Math.min(4000, Number(e.target.value) || 3400)) })}
            className="input-field mt-1" />
          {animation === 'wings' && (
            <p className="text-2xs text-text-muted mt-1">The wing animation's own loop is 3.4s — shorter durations will cut it off mid-animation.</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Animation Style</label>
        <div className="inline-flex bg-page rounded-lg p-0.5 border border-border mt-1">
          {(['wings', 'fade', 'none'] as const).map(s => (
            <button key={s} type="button" onClick={() => saveMut.mutate({ splashAnimation: s })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${animation === s ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <p className="text-sm font-medium text-text-primary">Show App Tagline</p>
        <button type="button" onClick={() => saveMut.mutate({ splashShowTagline: !showTagline })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${showTagline ? 'bg-green-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showTagline ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {showTagline && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tagline (Tamil)</label>
            <input defaultValue={cfg.splashTaglineTa ?? 'உங்கள் ஊர் செய்திகள்'}
              onBlur={(e) => saveMut.mutate({ splashTaglineTa: e.target.value })}
              className="input-field mt-1" />
          </div>
          <div>
            <label className="label">Tagline (English)</label>
            <input defaultValue={cfg.splashTaglineEn ?? 'Your town, your news'}
              onBlur={(e) => saveMut.mutate({ splashTaglineEn: e.target.value })}
              className="input-field mt-1" />
          </div>
        </div>
      )}

      <div>
        <label className="label">Splash Logo URL (optional — falls back to the app icon)</label>
        <input defaultValue={cfg.splashLogoUrl ?? ''} placeholder="https://..."
          onBlur={(e) => saveMut.mutate({ splashLogoUrl: e.target.value || null })}
          className="input-field mt-1" />
      </div>
    </div>
  );
}

// ─── Live: Rate Ticker ──────────────────────────────────────────────────────

function LiveRateTicker() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
    onError: () => toast.error('Save failed'),
  });
  const cfg = data?.data ?? {};
  const enabled: boolean = cfg.rateTickerEnabled ?? true;

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-text-primary">Show Rate Ticker</p>
          <p className="text-xs text-text-muted">The strip under the Home feed with sponsor name + gold/silver rates</p>
        </div>
        <button type="button" onClick={() => saveMut.mutate({ rateTickerEnabled: !enabled })}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div>
        <label className="label">Sponsor Name</label>
        <input defaultValue={cfg.rateTickerSponsorName ?? 'ஸ்ரீ லக்ஷ்மி நகைமாளிகை'}
          onBlur={(e) => saveMut.mutate({ rateTickerSponsorName: e.target.value })}
          className="input-field mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Gold Rate (22K, per gram)</label>
          <input defaultValue={cfg.rateTickerGoldRate ?? '₹7,240'}
            onBlur={(e) => saveMut.mutate({ rateTickerGoldRate: e.target.value })}
            className="input-field mt-1" />
        </div>
        <div>
          <label className="label">Silver Rate (per gram)</label>
          <input defaultValue={cfg.rateTickerSilverRate ?? '₹96'}
            onBlur={(e) => saveMut.mutate({ rateTickerSilverRate: e.target.value })}
            className="input-field mt-1" />
        </div>
      </div>
      <p className="text-xs text-text-muted">Rates are entered manually — there's no live market-rate feed wired up yet.</p>
    </div>
  );
}

// ─── Live: Onboarding Carousel ────────────────────────────────────────────────

interface OnboardingSlide {
  imageUrl: string | null;
  titleTa: string;
  titleEn: string;
  descTa: string;
  descEn: string;
}

const BLANK_SLIDE: OnboardingSlide = { imageUrl: null, titleTa: '', titleEn: '', descTa: '', descEn: '' };

function LiveOnboardingCarousel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
    onError: () => toast.error('Save failed'),
  });

  const cfg = data?.data ?? {};
  const slides: OnboardingSlide[] = cfg.onboardingSlides ?? [];

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  const updateSlide = (i: number, patch: Partial<OnboardingSlide>) => {
    const next = slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    saveMut.mutate({ onboardingSlides: next });
  };

  const addSlide = () => saveMut.mutate({ onboardingSlides: [...slides, { ...BLANK_SLIDE }] });
  const removeSlide = (i: number) => {
    if (slides.length <= 1) { toast.error('At least 1 slide is required'); return; }
    saveMut.mutate({ onboardingSlides: slides.filter((_, idx) => idx !== i) });
  };
  const moveSlide = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    saveMut.mutate({ onboardingSlides: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        Shown to first-time users before the language/district setup screen. Reader app falls back to its built-in default slides if this list is empty.
      </p>

      {slides.map((s, i) => (
        <div key={i} className="p-4 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Slide {i + 1}</span>
            <div className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => moveSlide(i, 'up')} className="btn-ghost px-2 py-1 text-xs disabled:opacity-30">↑</button>
              <button type="button" disabled={i === slides.length - 1} onClick={() => moveSlide(i, 'down')} className="btn-ghost px-2 py-1 text-xs disabled:opacity-30">↓</button>
              <button type="button" onClick={() => removeSlide(i)} className="btn-ghost px-2 py-1 text-xs text-red">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div>
            <label className="label">Image URL (optional — falls back to a placeholder)</label>
            <div className="flex items-center gap-2 mt-1">
              <Upload size={14} className="text-text-muted flex-shrink-0" />
              <input defaultValue={s.imageUrl ?? ''} placeholder="https://..."
                onBlur={(e) => updateSlide(i, { imageUrl: e.target.value || null })}
                className="input-field h-9 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Title (Tamil)</label>
              <input defaultValue={s.titleTa} onBlur={(e) => updateSlide(i, { titleTa: e.target.value })} className="input-field h-9 text-sm" />
            </div>
            <div>
              <label className="label">Title (English)</label>
              <input defaultValue={s.titleEn} onBlur={(e) => updateSlide(i, { titleEn: e.target.value })} className="input-field h-9 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Description (Tamil)</label>
              <textarea defaultValue={s.descTa} rows={2} onBlur={(e) => updateSlide(i, { descTa: e.target.value })} className="input-field resize-none text-sm" />
            </div>
            <div>
              <label className="label">Description (English)</label>
              <textarea defaultValue={s.descEn} rows={2} onBlur={(e) => updateSlide(i, { descEn: e.target.value })} className="input-field resize-none text-sm" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addSlide} className="btn-secondary w-full justify-center">
        <Plus size={14} /> Add Slide
      </button>
    </div>
  );
}

// ─── Live: Theme default mode (rest of Theme & Colors remains Planned) ───────

function LiveThemeDefault() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: Record<string, any> }>('/admin/app-config'),
  });
  const saveMut = useMutation({
    mutationFn: (v: any) => apiPatch('/admin/app-config', v),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['app-config'] }); },
  });
  const cfg = data?.data ?? {};
  const mode: 'light' | 'dark' | 'system' = cfg.defaultThemeMode ?? 'system';

  if (isLoading) return <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Default Theme</label>
        <div className="inline-flex bg-page rounded-lg p-0.5 border border-border mt-1">
          {([
            { v: 'light', icon: <Sun size={13} /> },
            { v: 'dark', icon: <Moon size={13} /> },
            { v: 'system', icon: <MonitorSmartphone size={13} /> },
          ] as const).map(o => (
            <button key={o.v} type="button" onClick={() => saveMut.mutate({ defaultThemeMode: o.v })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${mode === o.v ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted'}`}>
              {o.icon} {o.v}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-1.5">The theme new app sessions start in. Readers can still switch it themselves from the Side Menu.</p>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg">
        {['Primary Color', 'Secondary Color', 'Accent Color', 'Allow User Theme Toggle', 'Status Bar Style'].map(f => (
          <div key={f} className="flex items-center justify-between px-3 py-3">
            <p className="text-sm font-medium text-text-primary">{f}</p>
            <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Planned</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Colors are compiled into the app's static theme today; making them remotely configurable needs a broader theming refactor across every screen — not done yet.
      </p>
    </div>
  );
}

// ─── Section Detail Drawer ────────────────────────────────────────────────────

function SectionDetail({ section, onClose }: { section: ConfigSection; onClose: () => void }) {
  const LIVE_SECTION_IDS = [
    'reader_identity', 'feature_flags', 'reader_home_layout', 'reader_widgets',
    'reader_navigation', 'reader_menu', 'reader_news_sections',
    'reader_ads', 'reader_notifications', 'reader_splash', 'reader_onboarding', 'reader_rate_ticker',
  ];
  const isLive = LIVE_SECTION_IDS.includes(section.id);
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
          {section.id === 'reader_home_layout' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveHomeLayout />
            </div>
          )}
          {section.id === 'reader_widgets' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Widgets</p>
              <LiveWidgets />
            </div>
          )}
          {section.id === 'reader_navigation' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveBottomNav />
            </div>
          )}
          {section.id === 'reader_menu' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Side Menu</p>
              <LiveSideMenu />
            </div>
          )}
          {section.id === 'reader_news_sections' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveNewsSections />
            </div>
          )}
          {section.id === 'reader_ads' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveAdvertisement />
            </div>
          )}
          {section.id === 'reader_notifications' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveNotifications />
            </div>
          )}
          {section.id === 'reader_splash' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveSplash />
            </div>
          )}
          {section.id === 'reader_rate_ticker' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveRateTicker />
            </div>
          )}
          {section.id === 'reader_onboarding' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Onboarding Slides</p>
              <LiveOnboardingCarousel />
            </div>
          )}
          {section.id === 'reader_theme' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Live Configuration</p>
              <LiveThemeDefault />
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
