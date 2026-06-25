// src/pages/AppConfigPage.tsx
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Smartphone, Palette, Type, LayoutGrid, Loader2, Shield,
  Moon, Sun, MonitorSmartphone, Lock, Unlock,
} from 'lucide-react';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const FONT_OPTIONS = [
  { value: 'system',   label: 'System Default',  preview: 'Aa' },
  { value: 'noto',     label: 'Noto Sans Tamil',  preview: 'அ' },
  { value: 'latha',    label: 'Latha',             preview: 'அ' },
  { value: 'inter',    label: 'Inter',             preview: 'Aa' },
];

const PRESET_COLORS = [
  { label: 'Agnisiragu Red',   primary: '#CC1F2D', name: 'red' },
  { label: 'Navy Blue',        primary: '#1E3A5F', name: 'navy' },
  { label: 'Forest Green',     primary: '#16A34A', name: 'green' },
  { label: 'Deep Purple',      primary: '#7C3AED', name: 'purple' },
  { label: 'Amber Orange',     primary: '#D97706', name: 'amber' },
  { label: 'Ocean Teal',       primary: '#0891B2', name: 'teal' },
];

const schema = z.object({
  appNameTa:         z.string().min(1, 'Tamil name required'),
  appNameEn:         z.string().min(1, 'English name required'),
  primaryColor:      z.string().min(4, 'Select a color'),
  fontFamily:        z.string(),
  theme:             z.enum(['light', 'dark', 'system']),
  freeArticleLimit:  z.coerce.number().int().min(1).max(50),
  breakingNewsAlert: z.boolean(),
  loginRequired:     z.boolean(),
  maintenanceMode:   z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  appNameTa: 'அக்னிசிறகு', appNameEn: 'Agnisiragu',
  primaryColor: '#CC1F2D', fontFamily: 'system',
  theme: 'light', freeArticleLimit: 10,
  breakingNewsAlert: true, loginRequired: true, maintenanceMode: false,
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-red' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function AppConfigPage() {
  const { admin } = useAuthStore();
  const [customColor, setCustomColor] = useState('');

  if (admin?.adminRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={48} className="mb-3" />
        <p className="text-lg font-medium text-gray-600">Access Restricted</p>
        <p className="text-sm mt-1">Only Super Admins can configure the app.</p>
      </div>
    );
  }

  return <AppConfigForm customColor={customColor} setCustomColor={setCustomColor} />;
}

function AppConfigForm({ customColor, setCustomColor }: { customColor: string; setCustomColor: (v: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => apiGet<{ data: FormValues }>('/admin/app-config'),
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (data?.data) {
      Object.entries(data.data).forEach(([k, v]) => setValue(k as any, v));
    }
  }, [data, setValue]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormValues) => apiPatch('/admin/app-config', payload),
    onSuccess: () => toast.success('App configuration saved'),
    onError: () => toast.error('Failed to save configuration'),
  });

  const watchedColor    = watch('primaryColor');
  const watchedTheme    = watch('theme');
  const watchedFont     = watch('fontFamily');
  const maintenanceMode = watch('maintenanceMode');

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-red" /></div>;
  }

  return (
    <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-5">
      {/* App identity */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-text-muted" />
            <span className="section-title">App Identity</span>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">App Name (Tamil)</label>
            <input {...register('appNameTa')} className="input-field text-lg" placeholder="அக்னிசிறகு" />
            {errors.appNameTa && <p className="mt-1 text-xs text-status-red">{errors.appNameTa.message}</p>}
          </div>
          <div>
            <label className="label">App Name (English)</label>
            <input {...register('appNameEn')} className="input-field" placeholder="Agnisiragu" />
            {errors.appNameEn && <p className="mt-1 text-xs text-status-red">{errors.appNameEn.message}</p>}
          </div>
          <div>
            <label className="label">Free Article Limit</label>
            <div className="relative">
              <input {...register('freeArticleLimit')} type="number" min="1" max="50" className="input-field" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">articles</span>
            </div>
            <p className="text-2xs text-text-muted mt-1">Users must log in after this many articles</p>
            {errors.freeArticleLimit && <p className="mt-1 text-xs text-status-red">{errors.freeArticleLimit.message}</p>}
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-text-muted" />
            <span className="section-title">App Theme</span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => {
              const icons = { light: Sun, dark: Moon, system: MonitorSmartphone };
              const Icon = icons[t];
              return (
                <button
                  key={t} type="button"
                  onClick={() => setValue('theme', t)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    watchedTheme === t
                      ? 'border-red bg-red/5'
                      : 'border-border hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} className={watchedTheme === t ? 'text-red' : 'text-text-muted'} />
                  <span className={`text-xs font-medium capitalize ${watchedTheme === t ? 'text-red' : 'text-text-secondary'}`}>{t}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Color */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-text-muted" />
            <span className="section-title">Primary Color</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Current:</span>
            <span className="w-5 h-5 rounded-full border border-border" style={{ background: watchedColor }} />
            <span className="text-xs font-mono text-text-secondary">{watchedColor}</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.name} type="button"
                onClick={() => setValue('primaryColor', c.primary)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  watchedColor === c.primary ? 'border-gray-400 scale-105' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <span className="w-10 h-10 rounded-full shadow-md border-2 border-white" style={{ background: c.primary }} />
                <span className="text-2xs text-text-muted text-center leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <label className="label mb-0 whitespace-nowrap">Custom Color</label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="color"
                value={customColor || watchedColor}
                onChange={(e) => { setCustomColor(e.target.value); setValue('primaryColor', e.target.value); }}
                className="w-10 h-9 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={customColor || watchedColor}
                onChange={(e) => { setCustomColor(e.target.value); setValue('primaryColor', e.target.value); }}
                placeholder="#CC1F2D"
                className="input-field font-mono max-w-[120px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Type size={16} className="text-text-muted" />
            <span className="section-title">Font Family</span>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value} type="button"
              onClick={() => setValue('fontFamily', f.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                watchedFont === f.value
                  ? 'border-red bg-red/5'
                  : 'border-border hover:border-gray-300'
              }`}
            >
              <span className="text-2xl text-text-primary">{f.preview}</span>
              <span className={`text-xs font-medium text-center ${watchedFont === f.value ? 'text-red' : 'text-text-secondary'}`}>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature toggles */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-text-muted" />
            <span className="section-title">Feature Toggles</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {[
            {
              key: 'breakingNewsAlert' as const,
              label: 'Breaking News Alerts',
              desc: 'Show breaking news banner at top of home screen',
            },
            {
              key: 'loginRequired' as const,
              label: 'Login Gate',
              desc: `Require login after ${watch('freeArticleLimit')} free articles`,
            },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <Toggle checked={!!watch(key)} onChange={(v) => setValue(key, v)} />
            </div>
          ))}

          {/* Maintenance mode - dangerous */}
          <div className={`flex items-center justify-between px-5 py-4 ${maintenanceMode ? 'bg-red/5' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${maintenanceMode ? 'bg-red/10' : 'bg-page'}`}>
                {maintenanceMode ? <Lock size={15} className="text-red" /> : <Unlock size={15} className="text-text-muted" />}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                  Maintenance Mode
                  {maintenanceMode && <span className="badge badge-red">ACTIVE</span>}
                </p>
                <p className="text-xs text-text-muted mt-0.5">App shows a maintenance screen to all users</p>
              </div>
            </div>
            <Toggle checked={!!maintenanceMode} onChange={(v) => setValue('maintenanceMode', v)} />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">Live Preview</span>
          <span className="text-2xs text-text-muted">Approximate appearance</span>
        </div>
        <div className="p-5 flex justify-center">
          <div className="w-52 rounded-2xl overflow-hidden border-4 border-ink-900 shadow-xl">
            <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: watchedColor }}>
              <div className="flex-1">
                <p className="text-white text-xs font-bold leading-tight">{watch('appNameTa')}</p>
                <p className="text-white/70 text-2xs">{watch('appNameEn')}</p>
              </div>
            </div>
            <div className="bg-white px-3 py-2 space-y-2">
              <div className="h-2.5 rounded bg-gray-200 w-3/4" />
              <div className="h-2 rounded bg-gray-100 w-full" />
              <div className="h-2 rounded bg-gray-100 w-5/6" />
              <div className="h-2 rounded bg-gray-100 w-2/3" />
              <div className="h-8 rounded mt-1" style={{ background: watchedColor + '15' }}>
                <div className="h-full flex items-center px-2">
                  <div className="h-2 w-16 rounded" style={{ background: watchedColor }} />
                </div>
              </div>
            </div>
            <div className="flex" style={{ background: watchedColor }}>
              {['முகப்பு', 'பிரிவு', 'தேடல்'].map(t => (
                <div key={t} className="flex-1 py-2 text-center">
                  <p className="text-white/80 text-2xs">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saveMutation.isPending} className="btn-primary px-8">
          {saveMutation.isPending && <Loader2 size={15} className="animate-spin" />}
          Save Configuration
        </button>
      </div>
    </form>
  );
}
