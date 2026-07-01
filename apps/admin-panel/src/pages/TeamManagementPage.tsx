// src/pages/TeamManagementPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Loader2, UsersRound,
  Shield, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Tag, Palette,
} from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

interface Team {
  id: string;
  name: string;
  nameTa?: string;
  type: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_PERMISSIONS = [
  'View articles',
  'Create articles',
  'Edit articles',
  'Publish articles',
  'Delete articles',
  'Manage categories',
  'View users',
  'Manage users',
  'View reports',
  'Send notifications',
  'Manage media',
  'View audit logs',
  'Manage local ads',
  'Configure app settings',
];

const COLOR_PRESETS = [
  '#CC1F2D', '#2563eb', '#16a34a', '#9333ea',
  '#ea580c', '#0891b2', '#be185d', '#ca8a04',
  '#64748b', '#7c3aed', '#059669', '#dc2626',
];

const teamSchema = z.object({
  name:        z.string().min(2, 'Min 2 characters'),
  nameTa:      z.string().optional(),
  type:        z.string().min(2, 'Min 2 characters'),
  description: z.string().optional(),
  color:       z.string().optional(),
});

type TeamForm = z.infer<typeof teamSchema>;

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {COLOR_PRESETS.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all ${value === c ? 'border-ink-900 scale-110' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-border" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="input-field text-xs font-mono flex-1" placeholder="#6366f1" maxLength={7} />
      </div>
    </div>
  );
}

function TeamCard({ team, onEdit, onDelete, onToggle }: {
  team: Team;
  onEdit: (t: Team) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card overflow-hidden border-l-4 transition-opacity ${!team.isActive ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: team.color }}>
      <div className="card-header cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ backgroundColor: team.color }}>
            {team.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-text-primary">{team.name}</p>
              {!team.isActive && (
                <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>
              )}
            </div>
            {team.nameTa && <p className="text-xs text-text-muted mt-0.5">{team.nameTa}</p>}
            {team.description && <p className="text-xs text-text-muted mt-0.5 truncate">{team.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-2xs font-mono bg-page text-text-muted px-2 py-1 rounded border border-border hidden sm:block">
            {team.type}
          </span>
          <button onClick={e => { e.stopPropagation(); onToggle(team.id); }}
            className="btn-ghost p-1.5 rounded text-text-muted hover:text-text-primary" title={team.isActive ? 'Deactivate' : 'Activate'}>
            {team.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(team); }} className="btn-ghost p-1.5 rounded">
            <Edit2 size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(team.id); }} className="btn-ghost p-1.5 rounded text-status-red hover:bg-red/5">
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronDown size={14} className="text-text-muted ml-1" /> : <ChevronRight size={14} className="text-text-muted ml-1" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 bg-page">
          <p className="text-2xs font-semibold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
            <Shield size={10} /> Default Permissions
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_PERMISSIONS.map(p => (
              <span key={p} className="text-2xs bg-surface border border-border text-text-secondary px-2 py-1 rounded">
                ✓ {p}
              </span>
            ))}
          </div>
          <p className="text-2xs text-text-muted mt-3">
            Created {new Date(team.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function TeamManagementPage() {
  const { admin } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [color, setColor] = useState('#6366f1');

  const { data, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => apiGet<{ data: Team[] }>('/teams'),
  });
  const teams = data?.data ?? [];

  const form = useForm<TeamForm>({ resolver: zodResolver(teamSchema) });

  const createMutation = useMutation({
    mutationFn: (p: TeamForm) => apiPost('/teams', { ...p, color }),
    onSuccess: () => {
      toast.success('Team created');
      qc.invalidateQueries({ queryKey: ['teams'] });
      setShowCreate(false); form.reset(); setColor('#6366f1');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create team'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TeamForm> & { color?: string } }) =>
      apiPatch(`/teams/${id}`, payload),
    onSuccess: () => {
      toast.success('Team updated');
      qc.invalidateQueries({ queryKey: ['teams'] });
      setEditing(null);
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/teams/${id}`),
    onSuccess: () => { toast.success('Team deleted'); qc.invalidateQueries({ queryKey: ['teams'] }); setDeleteId(null); },
    onError: () => toast.error('Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/teams/${id}/toggle`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
    onError: () => toast.error('Failed to update'),
  });

  function openEdit(t: Team) {
    setEditing(t); setColor(t.color);
    form.reset({ name: t.name, nameTa: t.nameTa ?? '', type: t.type, description: t.description ?? '' });
  }

  const isSuperAdmin = admin?.adminRole === 'SUPER_ADMIN';

  const EXAMPLE_TEAMS = [
    'Editorial Sports', 'Cinema', 'Politics', 'Technology',
    'Business', 'Local News', 'International', 'Marketing Team',
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><UsersRound size={20} className="text-red" /> Team Management</h1>
          <p className="text-sm text-text-muted mt-0.5">Create and manage editorial and operational teams</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => { setShowCreate(true); form.reset(); setColor('#6366f1'); }} className="btn-primary">
            <Plus size={16} /> New Team
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Teams', value: teams.length },
          { label: 'Active Teams', value: teams.filter(t => t.isActive).length },
          { label: 'Inactive', value: teams.filter(t => !t.isActive).length },
          { label: 'Categories', value: new Set(teams.map(t => t.type.split('_')[0])).size },
        ].map(s => (
          <div key={s.label} className="card card-body text-center">
            <p className="stat-value text-2xl">{s.value}</p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Suggestion chips */}
      {teams.length === 0 && !isLoading && (
        <div className="card card-body">
          <p className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
            <Tag size={14} className="text-red" /> Suggested Teams
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_TEAMS.map(name => (
              <button key={name} onClick={() => {
                setShowCreate(true);
                const type = name.toUpperCase().replace(/\s+/g, '_');
                form.reset({ name, type });
              }} className="text-xs px-3 py-1.5 rounded-full border border-border text-text-secondary hover:border-red hover:text-red transition-colors">
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : teams.length === 0 ? (
        <div className="card card-body flex flex-col items-center justify-center h-40 text-text-muted">
          <UsersRound size={36} className="mb-3 opacity-30" />
          <p className="text-sm">No teams created yet</p>
          {isSuperAdmin && (
            <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-red hover:underline">
              Create your first team →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(t => (
            <TeamCard key={t.id} team={t}
              onEdit={openEdit}
              onDelete={setDeleteId}
              onToggle={(id) => toggleMutation.mutate(id)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create New Team" onClose={() => setShowCreate(false)}>
          <form onSubmit={form.handleSubmit(v => createMutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Team Name (English)</label>
                <input {...form.register('name')} className="input-field" placeholder="e.g. Editorial Sports" />
                {form.formState.errors.name && <p className="mt-1 text-xs text-status-red">{form.formState.errors.name.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Team Name (Tamil) <span className="text-text-muted font-normal">(optional)</span></label>
                <input {...form.register('nameTa')} className="input-field" placeholder="குழுவின் பெயர்" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label flex items-center gap-1.5">
                  Team Type Key <span className="text-text-muted font-normal text-2xs">(unique identifier)</span>
                </label>
                <input {...form.register('type')} className="input-field font-mono text-xs" placeholder="EDITORIAL_SPORTS" />
                {form.formState.errors.type && <p className="mt-1 text-xs text-status-red">{form.formState.errors.type.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="label">Description <span className="text-text-muted font-normal">(optional)</span></label>
                <textarea {...form.register('description')} rows={2} className="input-field resize-none"
                  placeholder="What does this team do?" />
              </div>
              <div className="col-span-2">
                <label className="label flex items-center gap-1.5"><Palette size={12} /> Team Color</label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </div>
            {/* Preview */}
            <div className="p-3 rounded-lg border border-border bg-page">
              <p className="text-2xs text-text-muted mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}>
                  {(form.watch('name') || 'T').charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{form.watch('name') || 'Team Name'}</p>
                  {form.watch('nameTa') && <p className="text-xs text-text-muted">{form.watch('nameTa')}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create Team
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal title="Edit Team" onClose={() => setEditing(null)}>
          <form onSubmit={form.handleSubmit(v => editMutation.mutate({ id: editing.id, payload: { ...v, color } }))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Team Name</label>
                <input {...form.register('name')} className="input-field" />
                {form.formState.errors.name && <p className="mt-1 text-xs text-status-red">{form.formState.errors.name.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="label">Team Name (Tamil)</label>
                <input {...form.register('nameTa')} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea {...form.register('description')} rows={2} className="input-field resize-none" />
              </div>
              <div className="col-span-2">
                <label className="label flex items-center gap-1.5"><Palette size={12} /> Team Color</label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={editMutation.isPending} className="btn-primary flex-1">
                {editMutation.isPending && <Loader2 size={14} className="animate-spin" />} Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-status-red" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Delete Team</p>
                <p className="text-sm text-text-muted">This will permanently delete the team.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="btn-danger flex-1">
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
