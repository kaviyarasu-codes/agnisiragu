// src/pages/MediaLibraryPage.tsx
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Trash2, Loader2, Image as ImageIcon, Film,
  Search, Copy, Check, X, ZoomIn, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import { apiGet, apiDelete, api } from '../lib/api';
import type { MediaFile } from '../types';

type MediaType = 'all' | 'image' | 'video';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Lightbox({ file, onClose }: { file: MediaFile; onClose: () => void }) {
  const isImage = file.mimeType.startsWith('image/');
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{file.filename}</p>
            <p className="text-gray-400 text-xs">{formatBytes(file.size)} · {file.mimeType}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
            >
              <ExternalLink size={13} /> Open original
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="bg-black rounded-lg overflow-hidden max-h-[75vh] flex items-center justify-center">
          {isImage
            ? <img src={file.url} alt={file.filename} className="max-w-full max-h-[75vh] object-contain" />
            : <video src={file.url} controls className="max-w-full max-h-[75vh]" />}
        </div>
      </div>
    </div>
  );
}

function MediaCard({ file, onDelete, onPreview }: {
  file: MediaFile;
  onDelete: (id: string) => void;
  onPreview: (f: MediaFile) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isImage = file.mimeType.startsWith('image/');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.url).then(() => {
      setCopied(true);
      toast.success('URL copied');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="group relative bg-surface rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
      <div className="aspect-square bg-page relative overflow-hidden cursor-pointer" onClick={() => onPreview(file)}>
        {isImage
          ? <img src={file.url} alt={file.filename} className="w-full h-full object-cover" loading="lazy" />
          : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Film size={36} className="text-text-muted" />
              <span className="text-2xs text-text-muted">MP4</span>
            </div>
          )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn size={22} className="text-white" />
        </div>

        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            title="Copy URL"
            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow text-text-secondary hover:text-text-primary transition-colors"
          >
            {copied ? <Check size={13} className="text-status-green" /> : <Copy size={13} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
            title="Delete"
            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow text-status-red hover:bg-red/5 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <span className={`absolute bottom-1.5 left-1.5 text-2xs font-semibold px-1.5 py-0.5 rounded ${isImage ? 'bg-blue-600 text-white' : 'bg-ink-800 text-white'}`}>
          {isImage ? 'IMG' : 'VID'}
        </span>
      </div>

      <div className="p-2.5">
        <p className="text-xs font-medium text-text-primary truncate leading-tight">{file.filename}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-2xs text-text-muted">{formatBytes(file.size)}</p>
          <p className="text-2xs text-text-muted">{format(new Date(file.createdAt), 'dd MMM')}</p>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [typeFilter, setTypeFilter] = useState<MediaType>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const queryClient = useQueryClient();

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['media', typeFilter, debouncedSearch],
    queryFn: () => apiGet<{ data: MediaFile[]; meta: { total: number } }>('/media', {
      type:   typeFilter !== 'all' ? typeFilter : undefined,
      search: debouncedSearch || undefined,
      limit:  100,
    }),
  });

  const media = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/media/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('File deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        await api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        ok++;
      } catch { toast.error(`Failed: ${file.name}`); }
    }
    setUploading(false);
    if (ok > 0) {
      toast.success(`${ok} file(s) uploaded`);
      void queryClient.invalidateQueries({ queryKey: ['media'] });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    void handleUpload(e.dataTransfer.files);
  };

  const hasFilter = typeFilter !== 'all' || !!debouncedSearch;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search files..."
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MediaType)}
            className="input-field w-auto text-sm flex-shrink-0"
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          {total > 0 && (
            <span className="text-xs text-text-muted whitespace-nowrap">
              {total} file{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <label className="btn-primary flex items-center gap-2 cursor-pointer flex-shrink-0">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Uploading...' : 'Upload Files'}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-red bg-red/5' : 'border-border hover:border-gray-300'}`}
      >
        <Upload size={28} className={`mx-auto mb-2 ${isDragging ? 'text-red' : 'text-text-muted'}`} />
        <p className="text-sm text-text-secondary">
          {isDragging ? 'Drop files here' : 'Drag & drop, or click to select'}
        </p>
        <p className="text-xs text-text-muted mt-1">JPG · PNG · GIF · WebP · MP4 | Images up to 5MB · Videos up to 50MB</p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-red" />
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={hasFilter ? 'No files match your filter' : 'No media files yet'}
          description={hasFilter ? 'Try changing the search or type filter' : 'Upload images and videos to build your media library'}
          action={!hasFilter ? (
            <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
              <Upload size={14} /> Upload your first file
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((file) => (
            <MediaCard key={file.id} file={file} onDelete={setDeleteTarget} onPreview={setPreview} />
          ))}
        </div>
      )}

      {preview && <Lightbox file={preview} onClose={() => setPreview(null)} />}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete File"
        message="This permanently removes the file from Cloudinary and the database."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
