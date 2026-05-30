// src/pages/SettingsPage.tsx
import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Settings, Loader2, Shield } from 'lucide-react';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import type { SiteSettings } from '../types';

const schema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  adMobAndroidAppId: z.string().min(1, 'Android App ID is required'),
  adMobIosAppId: z.string().min(1, 'iOS App ID is required'),
});

type FormValues = z.infer<typeof schema>;

function maskValue(val: string): string {
  if (!val || val.length <= 4) return '••••';
  return '••••' + val.slice(-4);
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
    queryFn: () => apiGet<{ data: SiteSettings }>('/admin/settings'),
  });

  const settings = data?.data;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (settings) {
      setValue('siteName', settings.siteName);
      setValue('adMobAndroidAppId', settings.adMobAndroidAppId);
      setValue('adMobIosAppId', settings.adMobIosAppId);
    }
  }, [settings, setValue]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormValues) => apiPatch('/admin/settings', payload),
    onSuccess: () => toast.success('Settings saved successfully'),
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
        {/* General */}
        <div className="card space-y-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            General Settings
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
            <input {...register('siteName')} className="input-field" placeholder="Agnisiragu" />
            {errors.siteName && <p className="mt-1 text-xs text-accent">{errors.siteName.message}</p>}
          </div>
        </div>

        {/* AdMob */}
        <div className="card space-y-4">
          <h3 className="text-base font-semibold text-gray-800">AdMob Configuration</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Android App ID</label>
            <input
              {...register('adMobAndroidAppId')}
              className="input-field font-mono"
              placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx"
            />
            {errors.adMobAndroidAppId && <p className="mt-1 text-xs text-accent">{errors.adMobAndroidAppId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">iOS App ID</label>
            <input
              {...register('adMobIosAppId')}
              className="input-field font-mono"
              placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx"
            />
            {errors.adMobIosAppId && <p className="mt-1 text-xs text-accent">{errors.adMobIosAppId.message}</p>}
          </div>
        </div>

        {/* MSG91 - Read Only */}
        <div className="card space-y-4">
          <h3 className="text-base font-semibold text-gray-800">MSG91 Configuration</h3>
          <p className="text-xs text-gray-400">These values are configured server-side and shown masked for security.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
            <input
              readOnly
              value={settings?.msg91SenderId ? maskValue(settings.msg91SenderId) : '••••••'}
              className="input-field bg-gray-50 text-gray-400 cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auth Key</label>
            <input
              readOnly
              value={settings?.msg91AuthKey ? maskValue(settings.msg91AuthKey) : '••••••••••••'}
              className="input-field bg-gray-50 text-gray-400 cursor-not-allowed font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
          Save Settings
        </button>
      </form>
    </div>
  );
}
