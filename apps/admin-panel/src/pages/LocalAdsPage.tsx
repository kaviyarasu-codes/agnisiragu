// src/pages/LocalAdsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus, Edit2, Trash2, X, Loader2, Megaphone,
  Image as ImageIcon, Video, LayoutTemplate, Layers,
  Eye, MousePointerClick, TrendingUp, Phone, Globe,
  Mail, MapPin, MessageSquare, Pause, Play, Search,
  Calendar, Target, Star, Tag, ChevronDown, Smartphone,
  Monitor, RefreshCw,
} from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import type { LocalAd, AdType, CtaType, AdStatus, AdPlacement } from '../types';

// ─── Static data ─────────────────────────────────────────────────────────────

const AD_TYPES: { value: AdType; label: string; labelTa: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'IMAGE',    label: 'Image',    labelTa: 'படம்',         icon: <ImageIcon size={16} />,    desc: 'Single image ad' },
  { value: 'VIDEO',    label: 'Video',    labelTa: 'வீடியோ',      icon: <Video size={16} />,        desc: 'Video advertisement' },
  { value: 'BANNER',   label: 'Banner',   labelTa: 'பேனர்',        icon: <LayoutTemplate size={16} />, desc: 'Full-width banner' },
  { value: 'CAROUSEL', label: 'Carousel', labelTa: 'கேரசல்',      icon: <Layers size={16} />,       desc: 'Multiple images' },
];

const CTA_OPTIONS: { value: CtaType; label: string; labelTa: string; icon: React.ReactNode; placeholder: string; hint: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp',     labelTa: 'வாட்ஸ்அப்',  icon: <MessageSquare size={14} />, placeholder: '+91 98765 43210',        hint: 'Opens WhatsApp chat' },
  { value: 'PHONE',    label: 'Phone Call',   labelTa: 'தொலைபேசி',  icon: <Phone size={14} />,         placeholder: '+91 98765 43210',        hint: 'Opens phone dialer' },
  { value: 'WEBSITE',  label: 'Website',      labelTa: 'வலைதளம்',    icon: <Globe size={14} />,         placeholder: 'https://mybusiness.com', hint: 'Opens in browser' },
  { value: 'EMAIL',    label: 'Email',        labelTa: 'மின்னஞ்சல்', icon: <Mail size={14} />,          placeholder: 'contact@business.com',   hint: 'Opens email app' },
  { value: 'MAPS',     label: 'Google Maps',  labelTa: 'இட வரைபடம்', icon: <MapPin size={14} />,        placeholder: '13.0827° N, 80.2707° E or business address', hint: 'Opens map location' },
  { value: 'FORM',     label: 'Contact Form', labelTa: 'தொடர்பு படிவம்', icon: <MessageSquare size={14} />, placeholder: 'https://forms.example.com', hint: 'Opens contact form' },
];

const PLACEMENTS: { value: AdPlacement; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { value: 'LOCAL',  label: 'Local Ad Only', icon: <Smartphone size={15} />, desc: 'Your custom ad shown inside the app', color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { value: 'ADMOB',  label: 'AdMob Only',    icon: <Monitor size={15} />,    desc: 'Google AdMob ads (revenue sharing)',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'BOTH',   label: 'Both',          icon: <RefreshCw size={15} />,  desc: 'Local ad + AdMob together',           color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

const STATUS_BADGE: Record<AdStatus, string> = {
  DRAFT:   'bg-gray-100 text-gray-600 border-gray-200',
  ACTIVE:  'bg-green-50 text-green-700 border-green-200',
  PAUSED:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  EXPIRED: 'bg-red/10 text-status-red border-red/20',
};

const PLACEMENT_BADGE: Record<AdPlacement, string> = {
  LOCAL: 'bg-teal-50 text-teal-700 border-teal-200',
  ADMOB: 'bg-blue-50 text-blue-700 border-blue-200',
  BOTH:  'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── Form schema ─────────────────────────────────────────────────────────────

const adSchema = z.object({
  title:          z.string().min(2, 'Title required (min 2 chars)'),
  description:    z.string().optional(),
  adType:         z.enum(['IMAGE', 'VIDEO', 'BANNER', 'CAROUSEL']),
  mediaUrl:       z.string().optional(),
  carousel:       z.array(z.object({ url: z.string().url('Enter valid URL') })).optional(),
  startDate:      z.string().min(1, 'Start date required'),
  endDate:        z.string().min(1, 'End date required'),
  categoryId:     z.string().optional(),
  targetAudience: z.string().optional(),
  priority:       z.coerce.number().int().min(1).max(100).default(50),
  status:         z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED']).default('DRAFT'),
  ctaType:        z.enum(['WHATSAPP', 'PHONE', 'WEBSITE', 'EMAIL', 'MAPS', 'FORM']),
  ctaValue:       z.string().min(1, 'CTA value is required'),
  placement:      z.enum(['ADMOB', 'LOCAL', 'BOTH']).default('LOCAL'),
});

type AdForm = z.infer<typeof adSchema>;

// ─── Helper to build CTA redirect URL ────────────────────────────────────────
function buildCtaUrl(ctaType: CtaType, value: string): string {
  switch (ctaType) {
    case 'WHATSAPP': return `https://wa.me/${value.replace(/\D/g, '')}`;
    case 'PHONE':    return `tel:${value}`;
    case 'EMAIL':    return `mailto:${value}`;
    case 'MAPS':     return `https://maps.google.com/?q=${encodeURIComponent(value)}`;
    case 'WEBSITE':
    case 'FORM':     return value.startsWith('http') ? value : `https://${value}`;
    default:         return value;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-8 pb-4 px-4 overflow-y-auto">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface rounded-t-xl z-10">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded mt-0.5"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border mb-3">
      <span className="text-red">{icon}</span>
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</p>
    </div>
  );
}

function AdFormBody({ form, categories }: {
  form: ReturnType<typeof useForm<AdForm>>;
  categories: Array<{ id: string; name: string }>;
}) {
  const adType  = form.watch('adType');
  const ctaType = form.watch('ctaType');
  const ctaDef  = CTA_OPTIONS.find(c => c.value === ctaType);
  const placement = form.watch('placement');

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'carousel' });

  return (
    <div className="space-y-6">
      {/* 1. Ad Type */}
      <div>
        <SectionHeader icon={<Layers size={13} />} label="Ad Type" />
        <div className="grid grid-cols-4 gap-2">
          {AD_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => form.setValue('adType', t.value)}
              className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${adType === t.value ? 'border-red bg-red/5 text-red' : 'border-border text-text-secondary hover:border-gray-300 hover:bg-page'}`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span className="text-2xs opacity-60 font-normal">{t.labelTa}</span>
            </button>
          ))}
        </div>
        {form.formState.errors.adType && <p className="mt-1 text-xs text-status-red">{form.formState.errors.adType.message}</p>}
      </div>

      {/* 2. Content */}
      <div>
        <SectionHeader icon={<Tag size={13} />} label="Ad Content" />
        <div className="space-y-3">
          <div>
            <label className="label">Title *</label>
            <input {...form.register('title')} className="input-field" placeholder="e.g. Grand Opening Sale – 50% Off All Items" />
            {form.formState.errors.title && <p className="mt-1 text-xs text-status-red">{form.formState.errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description <span className="text-text-muted font-normal">(optional)</span></label>
            <textarea {...form.register('description')} rows={2} className="input-field resize-none"
              placeholder="Short description of the ad — shown below the title..." />
          </div>

          {/* Media URL — single for IMAGE/VIDEO/BANNER */}
          {adType !== 'CAROUSEL' && (
            <div>
              <label className="label">
                {adType === 'VIDEO' ? 'Video URL' : 'Image URL'} <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input {...form.register('mediaUrl')} className="input-field"
                placeholder={adType === 'VIDEO' ? 'https://cdn.example.com/video.mp4' : 'https://cdn.example.com/image.jpg'} />
              {form.watch('mediaUrl') && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border h-32 bg-page flex items-center justify-center">
                  {adType === 'VIDEO' ? (
                    <video src={form.watch('mediaUrl')} className="h-full w-full object-cover" controls={false} muted />
                  ) : (
                    <img src={form.watch('mediaUrl')} alt="preview" className="h-full w-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Carousel — multiple image URLs */}
          {adType === 'CAROUSEL' && (
            <div>
              <label className="label">Carousel Images <span className="text-text-muted font-normal">(add up to 10)</span></label>
              <div className="space-y-2">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <span className="text-2xs font-mono text-text-muted w-5 text-center">{i + 1}</span>
                    <input {...form.register(`carousel.${i}.url`)} className="input-field flex-1 text-sm"
                      placeholder={`https://cdn.example.com/image-${i + 1}.jpg`} />
                    <button type="button" onClick={() => remove(i)} className="btn-ghost p-1.5 rounded text-status-red hover:bg-red/5">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {fields.length < 10 && (
                  <button type="button" onClick={() => append({ url: '' })}
                    className="flex items-center gap-2 text-xs text-red hover:underline mt-1">
                    <Plus size={13} /> Add Image URL
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Targeting */}
      <div>
        <SectionHeader icon={<Target size={13} />} label="Targeting & Schedule" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label flex items-center gap-1.5"><Calendar size={12} /> Start Date *</label>
            <input {...form.register('startDate')} type="date" className="input-field" />
            {form.formState.errors.startDate && <p className="mt-1 text-xs text-status-red">{form.formState.errors.startDate.message}</p>}
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Calendar size={12} /> End Date *</label>
            <input {...form.register('endDate')} type="date" className="input-field" />
            {form.formState.errors.endDate && <p className="mt-1 text-xs text-status-red">{form.formState.errors.endDate.message}</p>}
          </div>
          <div>
            <label className="label">Category <span className="text-text-muted font-normal">(optional)</span></label>
            <select {...form.register('categoryId')} className="input-field">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority <span className="text-text-muted font-normal">(1–100)</span></label>
            <input {...form.register('priority')} type="number" min={1} max={100} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="label">Target Audience <span className="text-text-muted font-normal">(optional)</span></label>
            <input {...form.register('targetAudience')} className="input-field"
              placeholder="e.g. Women aged 25–40 in Chennai, Tamil Nadu" />
          </div>
          <div>
            <label className="label">Status</label>
            <select {...form.register('status')} className="input-field">
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. CTA */}
      <div>
        <SectionHeader icon={<MousePointerClick size={13} />} label="Call-To-Action (CTA)" />
        <div className="grid grid-cols-3 gap-2 mb-3">
          {CTA_OPTIONS.map(c => (
            <button key={c.value} type="button" onClick={() => form.setValue('ctaType', c.value)}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${ctaType === c.value ? 'bg-red/10 border-red/30 text-red' : 'border-border text-text-secondary hover:bg-page'}`}>
              {c.icon}
              <div className="text-left">
                <div>{c.label}</div>
                <div className="text-2xs opacity-60 font-normal">{c.labelTa}</div>
              </div>
            </button>
          ))}
        </div>
        {ctaDef && (
          <div>
            <label className="label">{ctaDef.label} Value *</label>
            <input {...form.register('ctaValue')} className="input-field" placeholder={ctaDef.placeholder} />
            <p className="text-2xs text-text-muted mt-1 flex items-center gap-1">
              {ctaDef.icon} {ctaDef.hint}
            </p>
            {form.formState.errors.ctaValue && <p className="mt-1 text-xs text-status-red">{form.formState.errors.ctaValue.message}</p>}
            {/* Live preview of redirect URL */}
            {form.watch('ctaValue') && (
              <p className="mt-1.5 text-2xs font-mono bg-page border border-border rounded px-2 py-1.5 text-text-muted break-all">
                → {buildCtaUrl(ctaType, form.watch('ctaValue'))}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 5. Placement */}
      <div>
        <SectionHeader icon={<Smartphone size={13} />} label="App Placement" />
        <div className="space-y-2">
          {PLACEMENTS.map(p => (
            <label key={p.value}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${placement === p.value ? `border-red/40 bg-red/5` : 'border-border hover:bg-page'}`}>
              <input type="radio" value={p.value} {...form.register('placement')} className="accent-red" />
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${p.color}`}>{p.icon}</div>
              <div>
                <p className="text-sm font-medium text-text-primary">{p.label}</p>
                <p className="text-xs text-text-muted">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdCard({ ad, categories, onEdit, onDelete, onToggle }: {
  ad: LocalAd;
  categories: Array<{ id: string; name: string }>;
  onEdit: (a: LocalAd) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, current: AdStatus) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const typeDef  = AD_TYPES.find(t => t.value === ad.adType);
  const ctaDef   = CTA_OPTIONS.find(c => c.value === ad.ctaType);
  const catName  = categories.find(c => c.id === ad.categoryId)?.name;
  const isActive = ad.status === 'ACTIVE';
  const ctr      = ad.impressions ? ((ad.clickCount / ad.impressions) * 100).toFixed(1) : '0.0';

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Media preview strip */}
      <div className="relative h-28 bg-page border-b border-border flex items-center justify-center overflow-hidden">
        {ad.mediaUrl && !imgErr ? (
          ad.adType === 'VIDEO' ? (
            <video src={ad.mediaUrl} className="w-full h-full object-cover" muted />
          ) : (
            <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover"
              onError={() => setImgErr(true)} />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted opacity-40">
            {typeDef?.icon}
            <span className="text-xs">{typeDef?.label}</span>
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`text-2xs px-2 py-0.5 rounded-full border font-semibold backdrop-blur-sm ${STATUS_BADGE[ad.status]}`}>
            {ad.status}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-2xs px-2 py-0.5 rounded-full border font-semibold backdrop-blur-sm ${PLACEMENT_BADGE[ad.placement]}`}>
            {ad.placement}
          </span>
        </div>
        {ad.priority >= 80 && (
          <div className="absolute bottom-2 left-2">
            <span className="text-2xs px-1.5 py-0.5 rounded bg-yellow-400/90 text-yellow-900 font-semibold flex items-center gap-1">
              <Star size={9} className="fill-yellow-900" /> High Priority
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Title & meta */}
        <div>
          <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">{ad.title}</p>
          {ad.description && <p className="text-xs text-text-muted mt-1 line-clamp-2">{ad.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-2xs px-2 py-0.5 rounded bg-page border border-border text-text-muted flex items-center gap-1">
              {typeDef?.icon} {typeDef?.label}
            </span>
            {catName && (
              <span className="text-2xs px-2 py-0.5 rounded bg-page border border-border text-text-muted flex items-center gap-1">
                <Tag size={9} /> {catName}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-border text-center">
          <div>
            <p className="text-sm font-bold text-text-primary">{(ad.impressions ?? 0).toLocaleString()}</p>
            <p className="text-2xs text-text-muted flex items-center justify-center gap-0.5 mt-0.5"><Eye size={9} /> Views</p>
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">{(ad.clickCount ?? 0).toLocaleString()}</p>
            <p className="text-2xs text-text-muted flex items-center justify-center gap-0.5 mt-0.5"><MousePointerClick size={9} /> Clicks</p>
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">{ctr}%</p>
            <p className="text-2xs text-text-muted flex items-center justify-center gap-0.5 mt-0.5"><TrendingUp size={9} /> CTR</p>
          </div>
        </div>

        {/* CTA preview */}
        <a href={buildCtaUrl(ad.ctaType, ad.ctaValue)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-page text-xs text-text-secondary hover:border-red hover:text-red transition-colors">
          {ctaDef?.icon}
          <span className="flex-1 truncate">{ctaDef?.label}: {ad.ctaValue}</span>
        </a>

        {/* Dates */}
        <div className="flex items-center justify-between text-2xs text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {format(new Date(ad.startDate), 'dd MMM')} – {format(new Date(ad.endDate), 'dd MMM yyyy')}
          </span>
          <span>P:{ad.priority ?? 50}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button onClick={() => onToggle(ad.id, ad.status)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${isActive ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}>
            {isActive ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Activate</>}
          </button>
          <button onClick={() => onEdit(ad)} className="btn-ghost p-2 rounded-lg border border-border hover:bg-page">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(ad.id)} className="btn-ghost p-2 rounded-lg border border-border hover:bg-red/5 hover:border-red/20 text-status-red">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const defaultForm: Partial<AdForm> = {
  adType: 'IMAGE', ctaType: 'WHATSAPP', placement: 'LOCAL',
  status: 'DRAFT', priority: 50, carousel: [],
};

export default function LocalAdsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<LocalAd | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterPlacement, setFilterPlacement] = useState('');
  const [search, setSearch]             = useState('');

  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ['local-ads'],
    queryFn: () => apiGet<{ data: LocalAd[] }>('/local-ads'),
  });
  const { data: catData } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => apiGet<{ data: Array<{ id: string; name: string }> }>('/categories/admin/all'),
  });

  const allAds    = adsData?.data ?? [];
  const categories = catData?.data ?? [];

  const filtered = allAds.filter(ad => {
    if (filterStatus    && ad.status    !== filterStatus)    return false;
    if (filterType      && ad.adType    !== filterType)      return false;
    if (filterPlacement && ad.placement !== filterPlacement) return false;
    if (search && !ad.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total:       allAds.length,
    active:      allAds.filter(a => a.status === 'ACTIVE').length,
    paused:      allAds.filter(a => a.status === 'PAUSED').length,
    impressions: allAds.reduce((s, a) => s + (a.impressions ?? 0), 0),
    clicks:      allAds.reduce((s, a) => s + (a.clickCount ?? 0), 0),
  };

  const createForm = useForm<AdForm>({ resolver: zodResolver(adSchema), defaultValues: defaultForm as AdForm });
  const editForm   = useForm<AdForm>({ resolver: zodResolver(adSchema) });

  const createMut = useMutation({
    mutationFn: (p: AdForm) => {
      const payload = { ...p, carousel: p.carousel?.map(c => c.url) };
      return apiPost('/local-ads', payload);
    },
    onSuccess: () => {
      toast.success('Ad created successfully');
      qc.invalidateQueries({ queryKey: ['local-ads'] });
      setShowCreate(false); createForm.reset(defaultForm as AdForm);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create ad'),
  });

  const editMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: AdForm }) => {
      const payload = { ...p, carousel: p.carousel?.map(c => c.url) };
      return apiPatch(`/local-ads/${id}`, payload);
    },
    onSuccess: () => {
      toast.success('Ad updated');
      qc.invalidateQueries({ queryKey: ['local-ads'] });
      setEditing(null);
    },
    onError: () => toast.error('Failed to update ad'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete(`/local-ads/${id}`),
    onSuccess: () => {
      toast.success('Ad deleted');
      qc.invalidateQueries({ queryKey: ['local-ads'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdStatus }) =>
      apiPatch(`/local-ads/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['local-ads'] }),
    onError: () => toast.error('Failed to update status'),
  });

  function openEdit(ad: LocalAd) {
    setEditing(ad);
    const carouselArr = Array.isArray(ad.carousel) ? (ad.carousel as string[]).map(url => ({ url })) : [];
    editForm.reset({
      title:          ad.title,
      description:    ad.description ?? '',
      adType:         ad.adType,
      mediaUrl:       ad.mediaUrl ?? '',
      carousel:       carouselArr,
      startDate:      ad.startDate?.slice(0, 10) ?? '',
      endDate:        ad.endDate?.slice(0, 10) ?? '',
      categoryId:     ad.categoryId ?? '',
      targetAudience: ad.targetAudience ?? '',
      priority:       ad.priority ?? 50,
      status:         ad.status,
      ctaType:        ad.ctaType,
      ctaValue:       ad.ctaValue,
      placement:      ad.placement,
    });
  }

  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterType(''); setFilterPlacement(''); };
  const hasFilters   = search || filterStatus || filterType || filterPlacement;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><Megaphone size={20} className="text-red" /> Local Ads Department</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage local business advertisements — separate from Google AdMob</p>
        </div>
        <button onClick={() => { setShowCreate(true); createForm.reset(defaultForm as AdForm); }}
          className="btn-primary flex-shrink-0">
          <Plus size={16} /> Create Ad
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: 'Total Ads',    value: stats.total,        color: 'bg-pink-50 text-pink-600',   icon: <Megaphone size={16} /> },
          { label: 'Active',       value: stats.active,       color: 'bg-green-50 text-green-600', icon: <Play size={16} /> },
          { label: 'Paused',       value: stats.paused,       color: 'bg-yellow-50 text-yellow-600', icon: <Pause size={16} /> },
          { label: 'Impressions',  value: stats.impressions,  color: 'bg-blue-50 text-blue-600',   icon: <Eye size={16} /> },
          { label: 'Clicks',       value: stats.clicks,       color: 'bg-orange-50 text-orange-600', icon: <MousePointerClick size={16} /> },
        ].map(s => (
          <div key={s.label} className="card card-body flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="stat-value text-xl">{s.value.toLocaleString()}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card card-body flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ads by title..." className="input-field pl-8 text-xs" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-xs w-auto">
          <option value="">All Status</option>
          {(['DRAFT','ACTIVE','PAUSED','EXPIRED'] as AdStatus[]).map(s =>
            <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field text-xs w-auto">
          <option value="">All Types</option>
          {AD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterPlacement} onChange={e => setFilterPlacement(e.target.value)} className="input-field text-xs w-auto">
          <option value="">All Placements</option>
          {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-red hover:underline flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
        <span className="text-xs text-text-muted ml-auto">{filtered.length} ad{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Ad Grid */}
      {adsLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card card-body flex flex-col items-center justify-center h-48 text-text-muted">
          <Megaphone size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">{allAds.length === 0 ? 'No ads created yet' : 'No ads match your filters'}</p>
          {allAds.length === 0 && (
            <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-red hover:underline">
              Create your first local ad →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(ad => (
            <AdCard key={ad.id} ad={ad} categories={categories}
              onEdit={openEdit} onDelete={setDeleteId}
              onToggle={(id, current) => statusMut.mutate({ id, status: current === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })} />
          ))}
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Create Local Ad" subtitle="Fill in all required fields to publish a new advertisement"
          onClose={() => setShowCreate(false)}>
          <form onSubmit={createForm.handleSubmit(v => createMut.mutate(v))} className="space-y-6">
            <AdFormBody form={createForm} categories={categories} />
            <div className="flex gap-3 pt-4 border-t border-border sticky bottom-0 bg-surface">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={createMut.isPending} className="btn-primary flex-1">
                {createMut.isPending && <Loader2 size={14} className="animate-spin" />} Create Ad
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editing && (
        <Modal title="Edit Ad" subtitle={editing.title} onClose={() => setEditing(null)}>
          <form onSubmit={editForm.handleSubmit(v => editMut.mutate({ id: editing.id, p: v }))} className="space-y-6">
            <AdFormBody form={editForm} categories={categories} />
            <div className="flex gap-3 pt-4 border-t border-border sticky bottom-0 bg-surface">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={editMut.isPending} className="btn-primary flex-1">
                {editMut.isPending && <Loader2 size={14} className="animate-spin" />} Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-status-red" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Delete Ad</p>
                <p className="text-sm text-text-muted">Ad analytics will be lost. Cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteMut.mutate(deleteId)} disabled={deleteMut.isPending} className="btn-danger flex-1">
                {deleteMut.isPending && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
