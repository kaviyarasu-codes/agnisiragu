// src/pages/CategoryManagerPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Loader2, Tag } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategoryActive,
  useReorderCategory,
} from '../hooks/useCategories';
import type { Category } from '../types';

const schema = z.object({
  nameTa: z.string().min(1, 'Tamil name required'),
  nameEn: z.string().min(1, 'English name required'),
  slug: z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  iconUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function CategoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div>
        <input {...register('nameTa')} placeholder="Tamil Name (தமிழ்)" className="input-field" />
        {errors.nameTa && <p className="text-xs text-accent mt-1">{errors.nameTa.message}</p>}
      </div>
      <div>
        <input {...register('nameEn')} placeholder="English Name" className="input-field" />
        {errors.nameEn && <p className="text-xs text-accent mt-1">{errors.nameEn.message}</p>}
      </div>
      <div>
        <input {...register('slug')} placeholder="slug-here" className="input-field" />
        {errors.slug && <p className="text-xs text-accent mt-1">{errors.slug.message}</p>}
      </div>
      <div>
        <input {...register('iconUrl')} placeholder="Icon URL (optional)" className="input-field" />
      </div>
      <div className="col-span-2 flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
        <button type="submit" disabled={isLoading} className="btn-primary text-sm flex items-center gap-1">
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}

export default function CategoryManagerPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Use admin endpoint — shows ALL categories including inactive
  const { data, isLoading } = useAdminCategories();
  const categories = (data?.data ?? []).sort((a, b) => a.displayOrder - b.displayOrder);

  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();
  const toggleMutation = useToggleCategoryActive();
  const reorderMutation = useReorderCategory();

  const handleCreate = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({ ...values, isActive: true });
      toast.success('Category created');
      setShowAddForm(false);
    } catch {
      toast.error('Failed to create category');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success('Category deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleToggle = async (cat: Category) => {
    try {
      // Passes only the ID — backend flips isActive, never deletes
      await toggleMutation.mutateAsync(cat.id);
      toast.success(`Category ${cat.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update category status');
    }
  };

  const handleReorder = async (cat: Category, direction: 'up' | 'down') => {
    try {
      // Backend swaps displayOrder with adjacent category atomically
      await reorderMutation.mutateAsync({ id: cat.id, direction });
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{categories.length} total</p>
          {inactiveCount > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {inactiveCount} inactive
            </span>
          )}
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {showAddForm && (
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-red-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Tag size={36} className="mb-2" />
            <p className="text-sm">No categories yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Order</th>
                <th className="table-header">Tamil Name</th>
                <th className="table-header">English Name</th>
                <th className="table-header">Slug</th>
                <th className="table-header">Active</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => (
                editingId === cat.id ? (
                  <tr key={cat.id}>
                    <td colSpan={6} className="px-4 py-2">
                      <EditCategoryRow
                        category={cat}
                        onDone={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={cat.id}
                    className={`transition-colors ${cat.isActive ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}
                  >
                    {/* Order with up/down arrows */}
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReorder(cat, 'up')}
                          disabled={index === 0 || reorderMutation.isPending}
                          className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">{cat.displayOrder}</span>
                        <button
                          onClick={() => handleReorder(cat, 'down')}
                          disabled={index === categories.length - 1 || reorderMutation.isPending}
                          className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="table-cell font-medium">{cat.nameTa}</td>
                    <td className="table-cell">{cat.nameEn}</td>
                    <td className="table-cell">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{cat.slug}</code>
                    </td>

                    {/* Toggle — flips isActive, never deletes */}
                    <td className="table-cell">
                      <button
                        onClick={() => handleToggle(cat)}
                        disabled={toggleMutation.isPending}
                        title={cat.isActive ? 'Click to deactivate' : 'Click to activate'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          cat.isActive ? 'bg-green-500' : 'bg-gray-300'
                        } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            cat.isActive ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingId(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Inactive categories remain in the database. They are hidden from the public website and article form dropdowns, but visible here so you can re-enable them anytime.
      </p>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Category"
        message="Are you sure you want to delete this category? Articles in this category may be affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function EditCategoryRow({ category, onDone }: { category: Category; onDone: () => void }) {
  const updateMutation = useUpdateCategory(category.id);

  const handleSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success('Category updated');
      onDone();
    } catch {
      toast.error('Failed to update category');
    }
  };

  return (
    <CategoryForm
      defaultValues={{ nameTa: category.nameTa, nameEn: category.nameEn, slug: category.slug, iconUrl: category.iconUrl }}
      onSubmit={handleSubmit}
      onCancel={onDone}
      isLoading={updateMutation.isPending}
    />
  );
}
