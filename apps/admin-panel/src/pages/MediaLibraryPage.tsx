// src/pages/MediaLibraryPage.tsx
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Loader2, Image as ImageIcon, Film, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';
import { apiGet, apiDelete, api } from '../lib/api';
import type { MediaFile } from '../types';

type MediaType = 'all' | 'image' | 'video';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const [typeFilter, setTypeFilter] = useState<MediaType>('all');
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media', typeFilter],
    queryFn: () =>
      apiGet<{ data: MediaFile[] }>('/media', {
        type: typeFilter !== 'all' ? typeFilter : undefined,
      }),
  });

  const media = data?.data ?? [];

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
    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        successCount++;
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded`);
      void queryClient.invalidateQueries({ queryKey: ['media'] });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MediaType)}
            className="input-field w-auto text-sm"
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>

        <label className="btn-primary flex items-center gap-2 cursor-pointer">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Uploading...' : 'Upload Files'}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
        </label>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <Upload size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Drag & drop files here, or click Upload Files above</p>
        <p className="text-xs text-gray-400 mt-1">Supports: JPG, PNG, GIF, MP4, WebM</p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <ImageIcon size={40} className="mb-2" />
          <p className="text-sm">No media files yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((file) => {
            const isImage = file.mimeType.startsWith('image/');
            return (
              <div key={file.id} className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={32} className="text-gray-300" />
                    </div>
                  )}
                  <button
                    onClick={() => setDeleteTarget(file.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-700 truncate">{file.filename}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  <p className="text-xs text-gray-300">{format(new Date(file.createdAt), 'dd MMM')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete File"
        message="Are you sure you want to delete this file? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
