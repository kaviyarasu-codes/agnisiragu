// src/pages/SettingsPage.tsx
import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Settings, Loader2, Shield, Globe, Megaphone,
  Key, Server, ExternalLink,
} from 'lucide-react';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import type { SiteSettings } from '../types';

const schema = z.object({
  siteName:          z.string().min(1, 'Site name is required'),
  siteUrl:           z.string().url('Must be a valid URL').optional().or(z.literal('')),
  supportEmail:      z.string().email('Invalid email').optional().or(z.literal('')),
  adMobAndroidAppId: z.string().min(1, 'Android App ID is required'),
  adMobIosAppId:     z.string().min(1, 'iOS App ID is required'),
});

type FormValues = z.infer<typeof schema>;

function maskValue(val: string): string {
  if (!val || val.length <= 4) return '••••';
  return '••••' + val.slice(-4);
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input readOnly value={value} className="input-field bg-page text-text-muted cursor-not-allowed font-mono pr-10" />
        <Key size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { admin } = useAuthStore();
  if (admin?.adminRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={48} className="mb-3" />
        <p className="text-lg font-medium text-gray-600">Access Restricted</p>
        <p className="text-sm mt-1">Only Super Admins can access settings.</p>
      </div>
    );
  }
  return <SettingsForm />;
}

function SettingsForm() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiGet<{ data: SiteSettings & { siteUrl?: string; supportEmail?: string } }>('/admin/settings'),
  });
  const settings = data?.data;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (settings) {
      setValue('siteName', settings.siteName);
      setValue('adMobAndroidAppId', settings.adMobAndroidAppId);
      setValue('adMobIosAppId', settings.adMobIosAppId);
      setValue('siteUrl', (settings as any).siteUrl ?? '');
      setValue('supportEmail', (settings as any).supportEmail ?? '');
    }
  }, [settings, setValue]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormValues) => apiPatch('/admin/settings', payload),
    onSuccess: () => toast.success('Settings saved successfully'),
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-red" /></div>;
  }

  return (
    <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-5">
      {/* General + Site info */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* General */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-text-muted" />
              <span className="section-title">General Settings</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Site Name</label>
              <input {...register('siteName')} className="input-field" placeholder="Agnisiragu" />
              {errors.siteName && <p className="mt-1 text-xs text-status-red">{errors.siteName.message}</p>}
            </div>
            <div>
              <label className="label">Site URL</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input {...register('siteUrl')} className="input-field pl-8" placeholder="https://agnisiragu.com" />
              </div>
              {errors.siteUrl && <p className="mt-1 text-xs text-status-red">{errors.siteUrl.message}</p>}
            </div>
            <div>
              <label className="label">Support Email</label>
              <input {...register('supportEmail')} type="email" className="input-field" placeholder="support@agnisiragu.com" />
              {errors.supportEmail && <p className="mt-1 text-xs text-status-red">{errors.supportEmail.message}</p>}
            </div>
          </div>
        </div>

        {/* AdMob */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-text-muted" />
              <span className="section-title">AdMob Configuration</span>
            </div>
            <a
              href="https://admob.google.com"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-red hover:underline"
            >
              AdMob Console <ExternalLink size={11} />
            </a>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Android App ID</label>
              <input {...register('adMobAndroidAppId')} className="input-field font-mono" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx" />
              {errors.adMobAndroidAppId && <p className="mt-1 text-xs text-status-red">{errors.adMobAndroidAppId.message}</p>}
            </div>
            <div>
              <label className="label">iOS App ID</label>
              <input {...register('adMobIosAppId')} className="input-field font-mono" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx" />
              {errors.adMobIosAppId && <p className="mt-1 text-xs text-status-red">{errors.adMobIosAppId.message}</p>}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
              ⚠️ AdMob IDs are embedded in the app bundle. A new EAS build is required after changing these.
            </div>
          </div>
        </div>
      </div>

      {/* MSG91 + Firebase */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-text-muted" />
              <span className="section-title">MSG91 — OTP Service</span>
            </div>
            <span className="text-2xs text-text-muted bg-page px-2 py-1 rounded border border-border">Read-only</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-text-muted">Configured via server environment variables. Shown masked for security.</p>
            <ReadOnlyField label="Sender ID"    value={settings?.msg91SenderId ? maskValue(settings.msg91SenderId)  : '••••NSRG'} />
            <ReadOnlyField label="Auth Key"     value={settings?.msg91AuthKey  ? maskValue(settings.msg91AuthKey)   : '••••••••••••key'} />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              To update MSG91 credentials, change the <code className="font-mono bg-blue-100 px-1 rounded">MSG91_AUTH_KEY</code> env variable on your backend server.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-text-muted" />
              <span className="section-title">Firebase — Push Notifications</span>
            </div>
            <span className="text-2xs text-text-muted bg-page px-2 py-1 rounded border border-border">Read-only</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-text-muted">Firebase credentials are configured via server environment variables.</p>
            <ReadOnlyField label="Project ID"   value="••••••••agnisiragu" />
            <ReadOnlyField label="Server Key"   value="••••••••••••••••AAAA" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              To update Firebase credentials, change <code className="font-mono bg-blue-100 px-1 rounded">FCM_SERVER_KEY</code> on your backend server.
            </div>
          </div>
        </div>
      </div>

      {/* AWS S3 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-text-muted" />
            <span className="section-title">AWS S3 — Media Storage</span>
          </div>
          <span className="text-2xs text-text-muted bg-page px-2 py-1 rounded border border-border">Read-only</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ReadOnlyField label="Bucket Name"  value="••••agnisiragu-media" />
          <ReadOnlyField label="Region"       value="ap-south-1" />
          <ReadOnlyField label="Access Key"   value="••••••••KSIA" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saveMutation.isPending} className="btn-primary px-8">
          {saveMutation.isPending && <Loader2 size={15} className="animate-spin" />}
          Save Settings
        </button>
      </div>
    </form>
  );
}
