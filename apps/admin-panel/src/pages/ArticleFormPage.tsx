// src/pages/ArticleFormPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import toast from 'react-hot-toast';
import { Loader2, Upload, Bold, Italic, List, Heading2 } from 'lucide-react';
import { useArticle, useCreateArticle, useUpdateArticle, useAdminAccounts } from '../hooks/useArticles';
import { useCategories } from '../hooks/useCategories';
import type { ArticleStatus } from '../types';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const schema = z.object({
  titleTa: z.string().min(1, 'Tamil title is required'),
  titleEn: z.string().optional(),
  byline: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'DELETED']),
  isBreaking: z.boolean(),
  thumbnailUrl: z.string().optional(),
  scheduledAt: z.string().optional(),
  excerpt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
interface Props { mode: 'create' | 'edit'; }

/* ── Label helper ─────────────────────────────────────────────── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

/* ── Editor toolbar ───────────────────────────────────────────── */
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const btn = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active ? 'bg-red text-white' : 'text-gray-500 hover:bg-gray-100'}`;
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}><Bold size={13} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}><Italic size={13} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}><Heading2 size={13} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}><List size={13} /></button>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */
export default function ArticleFormPage({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ta' | 'en'>('ta');
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [bylineMode, setBylineMode] = useState<'select' | 'custom'>('select');

  const { data: articleData, isLoading: articleLoading } = useArticle(id ?? '');
  const { data: catData } = useCategories();
  const { data: adminData } = useAdminAccounts();
  const categories = catData?.data ?? [];
  const adminAccounts = adminData?.data ?? [];

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle(id ?? '');

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'DRAFT', isBreaking: false, byline: '', thumbnailUrl: '' },
  });

  const thumbnailUrl = watch('thumbnailUrl');
  const byline = watch('byline');

  const tamilEditor = useEditor({ extensions: [StarterKit, Image, Link], content: '' });
  const englishEditor = useEditor({ extensions: [StarterKit, Image, Link], content: '' });

  useEffect(() => {
    if (mode === 'edit' && articleData?.data) {
      const a = articleData.data;
      setValue('titleTa', a.titleTa);
      setValue('titleEn', a.titleEn);
      setValue('byline', a.byline ?? '');
      setValue('categoryId', a.category.id);
      setValue('status', a.status);
      setValue('isBreaking', a.isBreaking);
      setValue('thumbnailUrl', a.thumbnailUrl ?? '');
      setValue('excerpt', a.excerpt ?? '');
      setValue('scheduledAt', a.scheduledAt ?? '');
      if (a.thumbnailUrl) setThumbnailPreview(a.thumbnailUrl);
      tamilEditor?.commands.setContent(a.bodyTa);
      englishEditor?.commands.setContent(a.bodyEn);
    }
  }, [articleData, mode, tamilEditor, englishEditor, setValue]);

  const handleThumbnailUpload = async (file: File) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Cloudinary not configured — paste a URL below');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      fd.append('folder', 'agnisiragu');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { secure_url: string };
      setValue('thumbnailUrl', data.secure_url);
      setThumbnailPreview(data.secure_url);
      toast.success('Thumbnail uploaded');
    } catch {
      toast.error('Upload failed — paste URL below instead');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues, publishNow = false) => {
    const bodyTa = tamilEditor?.getHTML() ?? '';
    const rawBodyEn = englishEditor?.getHTML() ?? '';
    if (!bodyTa || bodyTa === '<p></p>') { toast.error('Tamil body is required'); setActiveTab('ta'); return; }
    const bodyEn = (!rawBodyEn || rawBodyEn === '<p></p>') ? bodyTa : rawBodyEn;
    const payload = {
      ...values,
      titleEn: values.titleEn?.trim() || values.titleTa,
      bodyTa, bodyEn,
      status: publishNow ? ('PUBLISHED' as ArticleStatus) : values.status,
      scheduledAt: values.scheduledAt || undefined,
      excerpt: values.excerpt || undefined,
    };
    try {
      if (mode === 'create') { await createMutation.mutateAsync(payload); toast.success('Article created'); }
      else { await updateMutation.mutateAsync(payload); toast.success('Article updated'); }
      navigate('/articles');
    } catch { toast.error('Failed to save article'); }
  };

  if (mode === 'edit' && articleLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-red" /></div>;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v))} className="space-y-4 max-w-6xl">

      {/* ══ CONTENT (Language tabs) ══════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {(['ta', 'en'] as const).map((lang) => (
            <button key={lang} type="button" onClick={() => setActiveTab(lang)}
              className={`relative px-6 py-3 text-sm font-medium transition-colors flex items-center gap-1.5
                ${activeTab === lang ? 'text-red' : 'text-gray-400 hover:text-gray-600'}`}>
              {lang === 'ta' ? 'தமிழ் / Tamil' : 'English'}
              {lang === 'ta' && <span className="text-red-400 text-xs leading-none">*</span>}
              {lang === 'en' && <span className="text-[10px] text-gray-300 font-normal">(optional)</span>}
              {lang === 'ta' && errors.titleTa && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 absolute top-2.5 right-2" />
              )}
              {activeTab === lang && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {/* Tamil */}
          <div className={activeTab === 'ta' ? 'space-y-4' : 'hidden'}>
            <div>
              <Label required>Tamil Title</Label>
              <input {...register('titleTa')} className="input-field h-10" placeholder="தலைப்பு உள்ளிடுக" />
              {errors.titleTa && <p className="mt-1 text-xs text-red-500">{errors.titleTa.message}</p>}
            </div>
            <div>
              <Label required>Tamil Body</Label>
              <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-red-DEFAULT focus-within:ring-1 focus-within:ring-primary transition-all">
                <EditorToolbar editor={tamilEditor} />
                <EditorContent editor={tamilEditor} className="min-h-[220px] px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          {/* English */}
          <div className={activeTab === 'en' ? 'space-y-4' : 'hidden'}>
            <div>
              <Label>English Title <span className="normal-case font-normal text-gray-400">(falls back to Tamil)</span></Label>
              <input {...register('titleEn')} className="input-field h-10" placeholder="Enter title (optional)" />
            </div>
            <div>
              <Label>English Body <span className="normal-case font-normal text-gray-400">(falls back to Tamil)</span></Label>
              <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-red-DEFAULT focus-within:ring-1 focus-within:ring-primary transition-all">
                <EditorToolbar editor={englishEditor} />
                <EditorContent editor={englishEditor} className="min-h-[220px] px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN GRID ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT (2/3) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Publisher Name */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <Label required>Publisher / By Line</Label>

            {/* Segmented toggle */}
            <div className="inline-flex bg-gray-100 rounded-lg p-0.5 mb-3">
              <button type="button"
                onClick={() => setBylineMode('select')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  bylineMode === 'select'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                Select from team
              </button>
              <button type="button"
                onClick={() => setBylineMode('custom')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  bylineMode === 'custom'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                Custom name
              </button>
            </div>

            {bylineMode === 'select' ? (
              <select className="input-field h-10" value={byline} onChange={(e) => setValue('byline', e.target.value)}>
                <option value="">— Select publisher —</option>
                {adminAccounts.map((a) => (
                  <option key={a.id} value={a.name}>{a.name} · {a.adminRole}</option>
                ))}
                <option value="Agnisiragu Team">Agnisiragu Team</option>
                <option value="அக்னிசிரகு குழு">அக்னிசிரகு குழு</option>
              </select>
            ) : (
              <input className="input-field h-10"
                placeholder="e.g. சிவா குமார் / Siva Kumar"
                value={byline}
                onChange={(e) => setValue('byline', e.target.value)} />
            )}

            {byline && (
              <p className="mt-2 text-xs text-gray-400">
                Preview: <span className="text-gray-700 font-medium">By {byline}</span>
              </p>
            )}
            {errors.byline && <p className="mt-1 text-xs text-red-500">{errors.byline.message}</p>}
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <Label>Excerpt <span className="normal-case font-normal text-gray-400">(optional)</span></Label>
            <textarea {...register('excerpt')} rows={2}
              className="input-field resize-none text-sm leading-relaxed"
              placeholder="Short summary shown in article list..." />
          </div>

          {/* Thumbnail — REQUIRED */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <Label required>Thumbnail Image</Label>

            {(thumbnailPreview || thumbnailUrl) ? (
              <div className="relative rounded-lg overflow-hidden mb-3">
                <img src={thumbnailPreview || thumbnailUrl} alt="Thumbnail"
                  className="w-full h-44 object-cover" />
                <button type="button"
                  onClick={() => { setValue('thumbnailUrl', ''); setThumbnailPreview(''); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs transition-colors">
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-red-DEFAULT hover:bg-blue-50/50 transition-all mb-3 group">
                {uploading ? (
                  <Loader2 size={20} className="animate-spin text-red" />
                ) : (
                  <>
                    <Upload size={18} className="text-gray-300 group-hover:text-red mb-1.5 transition-colors" />
                    <span className="text-xs font-medium text-gray-500 group-hover:text-red transition-colors">Click to upload</span>
                    <span className="text-[11px] text-gray-300 mt-0.5">JPG, PNG, WEBP · max 5MB</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleThumbnailUpload(f); }} />
              </label>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 whitespace-nowrap">Or paste URL:</span>
              <input type="url" className="input-field h-9 text-xs flex-1"
                placeholder="https://example.com/image.jpg"
                value={thumbnailUrl || ''}
                onChange={(e) => { const u = e.target.value.trim(); setValue('thumbnailUrl', u); setThumbnailPreview(u); }} />
            </div>
            <Controller name="thumbnailUrl" control={control} render={({ field }) => <input {...field} type="hidden" />} />
            {errors.thumbnailUrl && <p className="mt-2 text-xs text-red-500">{errors.thumbnailUrl.message}</p>}
          </div>
        </div>

        {/* ── RIGHT (1/3) ────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Settings card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <Label required>Category</Label>
              <select {...register('categoryId')} className="input-field h-10">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameTa} / {c.nameEn}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>

            <div>
              <Label>Status</Label>
              <select {...register('status')} className="input-field h-10">
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Under Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="UNPUBLISHED">Unpublished</option>
              </select>
            </div>

            <div>
              <Label>Schedule Publish</Label>
              <input {...register('scheduledAt')} type="datetime-local" className="input-field h-10 text-sm" />
            </div>

            <div className="flex items-center gap-3 pt-1 pb-0.5">
              <Controller name="isBreaking" control={control} render={({ field }) => (
                <input type="checkbox" id="isBreaking" checked={field.value} onChange={field.onChange}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400 cursor-pointer" />
              )} />
              <label htmlFor="isBreaking" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                Breaking News
              </label>
            </div>
          </div>

          {/* Actions card */}
          <div className="card p-4 space-y-2">
            <button type="button" disabled={isSubmitting}
              onClick={handleSubmit((v) => onSubmit(v, true))}
              className="btn-primary w-full justify-center">
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Publish Now
            </button>
            <button type="submit" disabled={isSubmitting}
              className="btn-secondary w-full justify-center">
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Save Draft
            </button>
            <button type="button" onClick={() => navigate('/articles')}
              className="btn-ghost w-full justify-center">
              Cancel
            </button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1.5">💡 Tips</p>
            <ul className="space-y-1">
              <li className="text-xs text-blue-600">• English fields are optional — fall back to Tamil automatically</li>
              <li className="text-xs text-blue-600">• Thumbnail is required for better reader engagement</li>
              <li className="text-xs text-blue-600">• Breaking news appears prominently at top</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
