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
import { Loader2, Upload, Bold, Italic, List, Heading2, User } from 'lucide-react';
import { useArticle, useCreateArticle, useUpdateArticle, useAdminAccounts } from '../hooks/useArticles';
import { useCategories } from '../hooks/useCategories';
import type { ArticleStatus } from '../types';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const schema = z.object({
  titleTa: z.string().min(1, 'Tamil title is required'),
  titleEn: z.string().optional(),
  byline: z.string().min(1, 'Publisher name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'DELETED']),
  isBreaking: z.boolean(),
  thumbnailUrl: z.string().min(1, 'Thumbnail is required'),
  scheduledAt: z.string().optional(),
  excerpt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props { mode: 'create' | 'edit'; }

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('bold') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
        <Bold size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('italic') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
        <Italic size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
        <Heading2 size={14} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
        <List size={14} />
      </button>
    </div>
  );
}

export default function ArticleFormPage({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ta' | 'en'>('ta');
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [bylineMode, setBylineMode] = useState<'select' | 'custom'>('select');

  const { data: articleData, isLoading: articleLoading } = useArticle(id ?? '');
  const { data: catData } = useCategories();
  const { data: adminData } = useAdminAccounts();
  const categories = catData?.data ?? [];
  const adminAccounts = adminData?.data ?? [];

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle(id ?? '');

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'DRAFT', isBreaking: false, byline: '', thumbnailUrl: '' },
  });

  const thumbnailUrl = watch('thumbnailUrl');
  const byline = watch('byline');

  const tamilEditor = useEditor({ extensions: [StarterKit, Image, Link], content: '' });
  const englishEditor = useEditor({ extensions: [StarterKit, Image, Link], content: '' });

  useEffect(() => {
    if (mode === 'edit' && articleData?.data) {
      const article = articleData.data;
      setValue('titleTa', article.titleTa);
      setValue('titleEn', article.titleEn);
      setValue('byline', article.byline ?? '');
      setValue('categoryId', article.category.id);
      setValue('status', article.status);
      setValue('isBreaking', article.isBreaking);
      setValue('thumbnailUrl', article.thumbnailUrl ?? '');
      setValue('excerpt', article.excerpt ?? '');
      setValue('scheduledAt', article.scheduledAt ?? '');
      if (article.thumbnailUrl) setThumbnailPreview(article.thumbnailUrl);
      tamilEditor?.commands.setContent(article.bodyTa);
      englishEditor?.commands.setContent(article.bodyEn);
    }
  }, [articleData, mode, tamilEditor, englishEditor, setValue]);

  const handleThumbnailUpload = async (file: File) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Cloudinary not configured — paste a URL below');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'agnisiragu');
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      );
      if (!res.ok) throw new Error('Upload failed');
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

    if (!bodyTa || bodyTa === '<p></p>') {
      toast.error('Tamil body is required');
      setActiveTab('ta');
      return;
    }

    const bodyEn = (!rawBodyEn || rawBodyEn === '<p></p>') ? bodyTa : rawBodyEn;
    const titleEn = values.titleEn?.trim() || values.titleTa;

    const payload = {
      ...values,
      titleEn,
      bodyTa,
      bodyEn,
      status: publishNow ? ('PUBLISHED' as ArticleStatus) : values.status,
      scheduledAt: values.scheduledAt || undefined,
      excerpt: values.excerpt || undefined,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        toast.success('Article created');
      } else {
        await updateMutation.mutateAsync(payload);
        toast.success('Article updated');
      }
      navigate('/articles');
    } catch {
      toast.error('Failed to save article');
    }
  };

  if (mode === 'edit' && articleLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v))} className="space-y-5">

      {/* ── Language Content Tabs ─────────────────────────────────────── */}
      <div className="card p-0">
        <div className="flex border-b border-gray-200">
          <button type="button" onClick={() => setActiveTab('ta')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'ta' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}>
            தமிழ் / Tamil <span className="text-red-500 text-xs">*</span>
            {errors.titleTa && <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />}
          </button>
          <button type="button" onClick={() => setActiveTab('en')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'en' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}>
            English <span className="text-xs text-gray-400">(optional)</span>
          </button>
        </div>
        <div className="p-6">
          <div className={activeTab === 'ta' ? 'block space-y-4' : 'hidden'}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamil Title <span className="text-red-500">*</span>
              </label>
              <input {...register('titleTa')} className="input-field" placeholder="தலைப்பு உள்ளிடுக" />
              {errors.titleTa && <p className="mt-1 text-xs text-red-500">{errors.titleTa.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamil Body <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <EditorToolbar editor={tamilEditor} />
                <EditorContent editor={tamilEditor} className="min-h-[250px] px-3 py-2" />
              </div>
            </div>
          </div>
          <div className={activeTab === 'en' ? 'block space-y-4' : 'hidden'}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Title <span className="text-xs text-gray-400 font-normal">(falls back to Tamil)</span>
              </label>
              <input {...register('titleEn')} className="input-field" placeholder="Enter title (optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Body <span className="text-xs text-gray-400 font-normal">(falls back to Tamil)</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <EditorToolbar editor={englishEditor} />
                <EditorContent editor={englishEditor} className="min-h-[250px] px-3 py-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Publisher / Byline */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <User size={15} className="text-primary" />
              Publisher Name <span className="text-red-500">*</span>
            </label>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setBylineMode('select')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${bylineMode === 'select' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                Select from team
              </button>
              <button type="button" onClick={() => setBylineMode('custom')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${bylineMode === 'custom' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                Enter custom name
              </button>
            </div>

            {bylineMode === 'select' ? (
              <select
                className="input-field"
                value={byline}
                onChange={(e) => setValue('byline', e.target.value)}
              >
                <option value="">— Select publisher —</option>
                {adminAccounts.map((a) => (
                  <option key={a.id} value={a.name}>{a.name} ({a.adminRole})</option>
                ))}
                <option value="Agnisiragu Team">Agnisiragu Team</option>
                <option value="அக்னிசிரகு குழு">அக்னிசிரகு குழு</option>
              </select>
            ) : (
              <input
                className="input-field"
                placeholder="e.g. சிவா குமார் / Siva Kumar"
                value={byline}
                onChange={(e) => setValue('byline', e.target.value)}
              />
            )}

            {byline && (
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <span className="text-gray-400">Preview:</span>
                <span className="font-medium text-gray-700">By {byline}</span>
              </p>
            )}
            {errors.byline && <p className="mt-1 text-xs text-red-500">{errors.byline.message}</p>}
          </div>

          {/* Excerpt */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excerpt <span className="text-xs text-gray-400 font-normal">(optional — short summary)</span>
            </label>
            <textarea {...register('excerpt')} rows={3} className="input-field resize-none"
              placeholder="Short description shown in article list..." />
          </div>

          {/* Thumbnail — REQUIRED */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Thumbnail Image <span className="text-red-500">*</span>
            </label>

            {(thumbnailPreview || thumbnailUrl) ? (
              <div className="relative mb-3">
                <img src={thumbnailPreview || thumbnailUrl} alt="Thumbnail"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                <button type="button"
                  onClick={() => { setValue('thumbnailUrl', ''); setThumbnailPreview(''); }}
                  className="absolute top-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-500 shadow-md text-sm font-bold border">
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors mb-3">
                {uploading ? (
                  <Loader2 size={22} className="animate-spin text-primary" />
                ) : (
                  <>
                    <Upload size={22} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 font-medium">Click to upload thumbnail</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 5MB</span>
                  