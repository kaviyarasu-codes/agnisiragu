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
import { useArticle, useCreateArticle, useUpdateArticle } from '../hooks/useArticles';
import { useCategories } from '../hooks/useCategories';
import { api } from '../lib/api';
import type { ArticleStatus } from '../types';

const schema = z.object({
  titleTa: z.string().min(1, 'Tamil title is required'),
  titleEn: z.string().min(1, 'English title is required'),
  categoryId: z.string().min(1, 'Category is required'),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'DELETED']),
  isBreaking: z.boolean(),
  thumbnailUrl: z.string().optional(),
  scheduledAt: z.string().optional(),
  excerpt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  mode: 'create' | 'edit';
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('bold') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('italic') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}
      >
        <Heading2 size={14} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded text-sm transition-colors ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}
      >
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

  const { data: articleData, isLoading: articleLoading } = useArticle(id ?? '');
  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle(id ?? '');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'DRAFT',
      isBreaking: false,
    },
  });

  const thumbnailUrl = watch('thumbnailUrl');

  // Tamil editor
  const tamilEditor = useEditor({
    extensions: [StarterKit, Image, Link],
    content: '',
  });

  // English editor
  const englishEditor = useEditor({
    extensions: [StarterKit, Image, Link],
    content: '',
  });

  // Populate form in edit mode
  useEffect(() => {
    if (mode === 'edit' && articleData?.data) {
      const article = articleData.data;
      setValue('titleTa', article.titleTa);
      setValue('titleEn', article.titleEn);
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
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<{ data: { url: string } }>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue('thumbnailUrl', response.data.data.url);
      setThumbnailPreview(response.data.data.url);
      toast.success('Thumbnail uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues, publishNow = false) => {
    const bodyTa = tamilEditor?.getHTML() ?? '';
    const bodyEn = englishEditor?.getHTML() ?? '';

    if (!bodyTa || bodyTa === '<p></p>') {
      toast.error('Tamil body is required');
      return;
    }
    if (!bodyEn || bodyEn === '<p></p>') {
      toast.error('English body is required');
      return;
    }

    const payload = {
      ...values,
      bodyTa,
      bodyEn,
      status: publishNow ? ('PUBLISHED' as ArticleStatus) : values.status,
      scheduledAt: values.scheduledAt || undefined,
      thumbnailUrl: values.thumbnailUrl || undefined,
      excerpt: values.excerpt || undefined,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        toast.success('Article created successfully');
      } else {
        await updateMutation.mutateAsync(payload);
        toast.success('Article updated successfully');
      }
      navigate('/articles');
    } catch {
      toast.error('Failed to save article');
    }
  };

  if (mode === 'edit' && articleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v))} className="space-y-6 max-w-5xl">
      {/* Language Tabs */}
      <div className="card p-0">
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('ta')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'ta' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            தமிழ் / Tamil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'en' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            English
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tamil Tab */}
          <div className={activeTab === 'ta' ? 'block' : 'hidden'}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamil Title</label>
              <input {...register('titleTa')} className="input-field" placeholder="தலைப்பு உள்ளிடுக" />
              {errors.titleTa && <p className="mt-1 text-xs text-accent">{errors.titleTa.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tamil Body</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <EditorToolbar editor={tamilEditor} />
                <EditorContent editor={tamilEditor} className="min-h-[250px]" />
              </div>
            </div>
          </div>

          {/* English Tab */}
          <div className={activeTab === 'en' ? 'block' : 'hidden'}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">English Title</label>
              <input {...register('titleEn')} className="input-field" placeholder="Enter title" />
              {errors.titleEn && <p className="mt-1 text-xs text-accent">{errors.titleEn.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English Body</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <EditorToolbar editor={englishEditor} />
                <EditorContent editor={englishEditor} className="min-h-[250px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Excerpt */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (optional)</label>
            <textarea
              {...register('excerpt')}
              rows={3}
              className="input-field resize-none"
              placeholder="Short description of the article..."
            />
          </div>

          {/* Thumbnail */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
            {(thumbnailPreview || thumbnailUrl) && (
              <img
                src={thumbnailPreview || thumbnailUrl}
                alt="Thumbnail"
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors">
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-primary" />
              ) : (
                <>
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Click or drag to upload thumbnail</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleThumbnailUpload(file);
                }}
              />
            </label>
            <Controller
              name="thumbnailUrl"
              control={control}
              render={({ field }) => (
                <input {...field} type="hidden" />
              )}
            />
          </div>
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('categoryId')} className="input-field">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameTa} / {c.nameEn}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-accent">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className="input-field">
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="UNPUBLISHED">Unpublished</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Publish</label>
              <input
                {...register('scheduledAt')}
                type="datetime-local"
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-3">
              <Controller
                name="isBreaking"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isBreaking"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                )}
              />
              <label htmlFor="isBreaking" className="text-sm font-medium text-gray-700">
                Breaking News
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="card space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-outline w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit((v) => onSubmit(v, true))}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Publish Now
            </button>
            <button
              type="button"
              onClick={() => navigate('/articles')}
              className="btn-ghost w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
