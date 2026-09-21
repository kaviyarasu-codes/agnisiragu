// src/pages/ProfilePage.tsx
//
// "My Profile" — available to every admin/team member regardless of role
// (unlike AccountsPage, which is SUPER_ADMIN-only). Three sections:
//   1. Overview  — personal stats (articles, likes, comments, task counts)
//   2. Settings  — self-service name/phone/password/photo update
//   3. Tasks     — tasks assigned to me + (for managers/admins) tasks I've
//                  assigned to others, with an "Assign Task" picker scoped
//                  to whoever the backend says this admin may assign to.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Loader2, User, Newspaper, ThumbsUp, MessageSquare, FileEdit,
  LogIn, Gauge, Eye, EyeOff, ListTodo, Plus, X, Trash2,
  CheckCircle2, Circle, Clock, ChevronDown,
} from 'lucide-react';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { useMyTasks, useAssignedByMe, useAssignableUsers, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '../hooks/useTasks';
import type { Admin, Task, TaskStatus } from '../types';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadAvatar(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error('Cloudinary not configured');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  fd.append('folder', 'agnisiragu/avatars');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-lg' : size === 'sm' ? 'w-7 h-7 text-2xs' : 'w-9 h-9 text-xs';
  if (avatarUrl) return <img src={avatarUrl} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-red flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{name?.charAt(0).toUpperCase()}</span>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'tasks',     label: 'Tasks',    icon: ListTodo },
  { id: 'settings',  label: 'Settings', icon: User },
] as const;
type TabId = typeof TABS[number]['id'];

export default function ProfilePage() {
  const { admin, setAdmin } = useAuthStore();
  const [tab, setTab] = useState<TabId>('overview');

  if (!admin) return null;

  return (
    <div className="space-y-5">
      <div className="card card-body flex items-center gap-4">
        <div className="relative">
          <Avatar name={admin.name} avatarUrl={admin.avatarUrl} size="lg" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-text-primary truncate">{admin.name}</p>
          <p className="text-xs text-text-muted mt-0.5">{admin.email}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-2xs font-semibold bg-red/10 text-red border border-red/20">
            {admin.adminRole?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'border-red text-red' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab adminId={admin.id} />}
      {tab === 'tasks'    && <TasksTab />}
      {tab === 'settings' && <SettingsTab admin={admin} onSaved={(updated) => setAdmin({ ...admin, ...updated })} />}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: number | string; tint: string }) {
  return (
    <div className="card card-body flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tint}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="stat-value text-xl">{value}</p>
        <p className="text-2xs text-text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function OverviewTab({ adminId }: { adminId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile-stats', adminId],
    queryFn: () => apiGet<{ data: { metrics: Record<string, number>; articles: any[] } }>(`/admin/reports/member/${adminId}`),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-40"><Loader2 size={22} className="animate-spin text-text-muted" /></div>;
  }
  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-text-muted">
        <p className="text-sm text-status-red">Failed to load your stats.</p>
        <button onClick={() => refetch()} className="mt-2 text-xs font-semibold text-red hover:underline">Retry</button>
      </div>
    );
  }

  const m = data.data.metrics;
  const recentArticles = (data.data.articles ?? []).slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Newspaper}     label="Published Articles" value={m.published ?? 0}     tint="bg-blue-50 text-blue-600" />
        <StatCard icon={FileEdit}      label="Drafts"             value={m.drafts ?? 0}         tint="bg-amber-50 text-amber-600" />
        <StatCard icon={ThumbsUp}      label="Total Likes"        value={m.totalLikes ?? 0}     tint="bg-green-50 text-green-600" />
        <StatCard icon={MessageSquare} label="Total Comments"     value={m.totalComments ?? 0}  tint="bg-purple-50 text-purple-600" />
        <StatCard icon={LogIn}         label="Logins"             value={m.logins ?? 0}         tint="bg-ink-100 text-ink-700" />
        <StatCard icon={Gauge}         label="Activity Score"     value={m.score ?? 0}          tint="bg-red/10 text-red" />
        <StatCard icon={Circle}        label="Pending Tasks"      value={m.tasksPending ?? 0}   tint="bg-yellow-50 text-yellow-700" />
        <StatCard icon={CheckCircle2}  label="Completed Tasks"    value={m.tasksDone ?? 0}       tint="bg-teal-50 text-teal-700" />
      </div>

      <div className="card">
        <div className="card-header"><span className="section-title">Recent Articles</span></div>
        {recentArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-text-muted">
            <Eye size={20} className="mb-1" /><p className="text-xs">No articles yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentArticles.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm text-text-primary truncate pr-3">{a.titleEn}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded ${
                    a.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{a.status}</span>
                  <span className="text-2xs text-text-muted whitespace-nowrap">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  phone: z.string().optional(),
  password: z.string().optional(),
  avatarUrl: z.string().optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

function SettingsTab({ admin, onSaved }: { admin: Admin; onSaved: (updated: Partial<Admin>) => void }) {
  const [showPass, setShowPass] = useState(false);
  const [uploading, setUploading] = useState(false);
  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: admin.name, phone: admin.phone ?? '', password: '', avatarUrl: admin.avatarUrl ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (payload: SettingsForm) => {
      const { password, ...rest } = payload;
      const data = password && password.trim() !== '' ? { ...rest, password } : rest;
      return apiPatch<{ data: Admin }>('/admin/me', data);
    },
    onSuccess: (res) => {
      toast.success('Profile updated');
      if (res?.data) onSaved(res.data);
      form.setValue('password', '');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      form.setValue('avatarUrl', url);
      toast.success('Photo uploaded — save to apply');
    } catch {
      toast.error('Upload failed — try again');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="card card-body max-w-lg">
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div>
          <label className="label">Profile Photo</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={form.watch('name') || admin.name} avatarUrl={form.watch('avatarUrl')} />
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 size={14} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="profile-avatar-picker" className="btn-secondary text-xs px-3 py-1.5 cursor-pointer inline-flex">
                {form.watch('avatarUrl') ? 'Change Photo' : 'Upload Photo'}
              </label>
              <input id="profile-avatar-picker" type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {form.watch('avatarUrl') && (
                <button type="button" onClick={() => form.setValue('avatarUrl', '')} className="ml-2 text-2xs text-text-muted hover:text-status-red">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Full Name</label>
          <input {...form.register('name')} className="input-field" />
          {form.formState.errors.name && <p className="mt-1 text-xs text-status-red">{form.formState.errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email <span className="text-text-muted font-normal">(contact a super admin to change)</span></label>
          <input value={admin.email} disabled className="input-field opacity-60 cursor-not-allowed" />
        </div>

        <div>
          <label className="label">Phone Number <span className="text-text-muted font-normal">(optional)</span></label>
          <input {...form.register('phone')} type="tel" className="input-field" placeholder="+91 98765 43210" />
        </div>

        <div>
          <label className="label">New Password <span className="normal-case font-normal text-text-muted">(leave blank to keep current)</span></label>
          <div className="relative">
            <input {...form.register('password')} type={showPass ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<TaskStatus, { label: string; icon: any; cls: string }> = {
  NEW:         { label: 'New',         icon: Circle,       cls: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock,        cls: 'bg-amber-50 text-amber-700' },
  DONE:        { label: 'Done',        icon: CheckCircle2, cls: 'bg-green-50 text-green-700' },
};

function StatusBadge({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold ${m.cls}`}>
      <Icon size={10} /> {m.label}
    </span>
  );
}

function MyTaskRow({ task }: { task: Task }) {
  const updateStatus = useUpdateTaskStatus();
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{task.title}</p>
        {task.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{task.description}</p>}
        <p className="text-2xs text-text-muted mt-1">
          Assigned by {task.assignedBy?.name ?? '—'} · {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
          {task.dueDate && <> · Due {format(new Date(task.dueDate), 'dd MMM')}</>}
        </p>
      </div>
      <div className="relative flex-shrink-0">
        <select
          value={task.status}
          disabled={updateStatus.isPending}
          onChange={(e) => updateStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })}
          className="appearance-none text-2xs font-semibold pl-2.5 pr-6 py-1.5 rounded border border-border bg-page cursor-pointer"
        >
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
      </div>
    </div>
  );
}

function AssignedTaskRow({ task }: { task: Task }) {
  const deleteTask = useDeleteTask();
  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{task.title}</p>
        <p className="text-2xs text-text-muted mt-1">
          Assigned to {task.assignedTo?.name ?? '—'} · {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
        </p>
      </div>
      <StatusBadge status={task.status} />
      <button
        onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate(task.id); }}
        className="btn-ghost p-1.5 rounded text-status-red hover:bg-red/5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

const assignSchema = z.object({
  title: z.string().min(2, 'At least 2 characters'),
  description: z.string().optional(),
  assignedToId: z.string().min(1, 'Select someone'),
  dueDate: z.string().optional(),
});
type AssignForm = z.infer<typeof assignSchema>;

function TasksTab() {
  const myTasks = useMyTasks();
  const assignedByMe = useAssignedByMe();
  const assignable = useAssignableUsers();
  const createTask = useCreateTask();
  const [showAssign, setShowAssign] = useState(false);
  const form = useForm<AssignForm>({ resolver: zodResolver(assignSchema) });
  const canAssign = (assignable.data?.data?.length ?? 0) > 0;

  function submit(v: AssignForm) {
    createTask.mutate(
      { ...v, description: v.description || undefined, dueDate: v.dueDate || undefined },
      {
        onSuccess: () => { toast.success('Task assigned'); setShowAssign(false); form.reset(); },
        onError: () => toast.error('Failed to assign task'),
      },
    );
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="card-header">
          <span className="section-title">My Tasks</span>
        </div>
        {myTasks.isLoading ? (
          <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>
        ) : myTasks.isError ? (
          <div className="flex flex-col items-center justify-center h-24 text-text-muted">
            <p className="text-xs text-status-red">Failed to load tasks.</p>
            <button onClick={() => myTasks.refetch()} className="mt-1 text-xs font-semibold text-red hover:underline">Retry</button>
          </div>
        ) : (myTasks.data?.data?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-text-muted">
            <ListTodo size={20} className="mb-1" /><p className="text-xs">No tasks assigned to you</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {myTasks.data!.data.map((t) => <MyTaskRow key={t.id} task={t} />)}
          </div>
        )}
      </div>

      {canAssign && (
        <div className="card">
          <div className="card-header">
            <span className="section-title">Tasks I've Assigned</span>
            <button onClick={() => setShowAssign(true)} className="btn-primary text-xs px-3 py-1.5">
              <Plus size={13} /> Assign Task
            </button>
          </div>
          {assignedByMe.isLoading ? (
            <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>
          ) : assignedByMe.isError ? (
            <div className="flex flex-col items-center justify-center h-24 text-text-muted">
              <p className="text-xs text-status-red">Failed to load.</p>
              <button onClick={() => assignedByMe.refetch()} className="mt-1 text-xs font-semibold text-red hover:underline">Retry</button>
            </div>
          ) : (assignedByMe.data?.data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-text-muted">
              <p className="text-xs">You haven't assigned any tasks yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {assignedByMe.data!.data.map((t) => <AssignedTaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}

      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
              <h2 className="text-base font-semibold">Assign Task</h2>
              <button onClick={() => setShowAssign(false)} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
            </div>
            <form onSubmit={form.handleSubmit(submit)} className="p-6 space-y-4">
              <div>
                <label className="label">Assign To</label>
                <select {...form.register('assignedToId')} className="input-field">
                  <option value="">Select a team member…</option>
                  {assignable.data?.data.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} · {a.adminRole.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {form.formState.errors.assignedToId && <p className="mt-1 text-xs text-status-red">{form.formState.errors.assignedToId.message}</p>}
              </div>
              <div>
                <label className="label">Title</label>
                <input {...form.register('title')} className="input-field" placeholder="e.g. Cover the district sports meet" />
                {form.formState.errors.title && <p className="mt-1 text-xs text-status-red">{form.formState.errors.title.message}</p>}
              </div>
              <div>
                <label className="label">Description <span className="text-text-muted font-normal">(optional)</span></label>
                <textarea {...form.register('description')} rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="label">Due Date <span className="text-text-muted font-normal">(optional)</span></label>
                <input {...form.register('dueDate')} type="date" className="input-field" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssign(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={createTask.isPending} className="btn-primary flex-1">
                  {createTask.isPending && <Loader2 size={14} className="animate-spin" />} Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
