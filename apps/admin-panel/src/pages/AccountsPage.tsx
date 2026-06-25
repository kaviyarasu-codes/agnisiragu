// src/pages/AccountsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserPlus, Loader2, Shield, Edit2, Trash2, X,
  Eye, EyeOff, Crown, PenLine, CheckCircle,
  Smartphone, Users2, ChevronDown, ChevronRight,
  Star, User, MoreVertical, UserCheck, Ban,
} from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import type { Admin, AdminRole, TeamType } from '../types';
import { format } from 'date-fns';

// ─── Team Config ────────────────────────────────────────────────────────────

interface TeamDef {
  id: TeamType;
  label: string;
  labelTa: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  managerRole: AdminRole;
  memberRole: AdminRole;
  managerLabel: string;
  memberLabel: string;
  permissions: string[];
}

const TEAMS: TeamDef[] = [
  {
    id: 'EDITOR_TEAM',
    label: 'Editor Team',
    labelTa: 'எடிட்டர் குழு',
    description: 'Write, edit and publish news articles',
    icon: <PenLine size={18} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    managerRole: 'EDITOR_MANAGER',
    memberRole: 'EDITOR_MEMBER',
    managerLabel: 'Team Manager',
    memberLabel: 'Team Member',
    permissions: ['Create articles', 'Edit articles', 'Schedule publishing', 'Manage drafts'],
  },
  {
    id: 'VERIFICATION_TEAM',
    label: 'News Verification Team',
    labelTa: 'செய்தி சரிபார்ப்பு குழு',
    description: 'Verify and fact-check news before publishing',
    icon: <CheckCircle size={18} />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    managerRole: 'VERIFICATION_MANAGER',
    memberRole: 'VERIFICATION_MEMBER',
    managerLabel: 'Verification Manager',
    memberLabel: 'Fact Checker',
    permissions: ['Review articles', 'Approve/reject articles', 'Add verification notes', 'Flag misinformation'],
  },
  {
    id: 'REPORTER_APP_TEAM',
    label: 'Reporter App Team',
    labelTa: 'ரிப்போர்ட்டர் ஆப் குழு',
    description: 'Manage and moderate the Reporter mobile app',
    icon: <Smartphone size={18} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    managerRole: 'REPORTER_APP_MANAGER',
    memberRole: 'REPORTER_APP_MEMBER',
    managerLabel: 'App Manager',
    memberLabel: 'App Moderator',
    permissions: ['Review reporter submissions', 'Approve/reject voice notes', 'Manage app settings', 'Handle reporter queries'],
  },
  {
    id: 'REPORTERS_MANAGEMENT_TEAM',
    label: 'Reporters Management Team',
    labelTa: 'செய்தியாளர் மேலாண்மை குழு',
    description: 'Manage reporter accounts, verifications and rewards',
    icon: <Users2 size={18} />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    managerRole: 'REPORTERS_MANAGER',
    memberRole: 'REPORTERS_MEMBER',
    managerLabel: 'Reporters Manager',
    memberLabel: 'Support Member',
    permissions: ['Verify reporter identities', 'Issue Press ID cards', 'Manage reward payouts', 'Handle reporter accounts'],
  },
];

const ROLE_META: Record<AdminRole, { label: string; badge: string }> = {
  SUPER_ADMIN:          { label: 'Super Admin',          badge: 'bg-red/10 text-red border border-red/20' },
  ADMIN:                { label: 'Admin',                 badge: 'bg-ink-100 text-ink-800 border border-ink-200' },
  EDITOR_MANAGER:       { label: 'Team Manager',          badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
  EDITOR_MEMBER:        { label: 'Team Member',           badge: 'bg-blue-50 text-blue-600 border border-blue-100' },
  VERIFICATION_MANAGER: { label: 'Verification Manager',  badge: 'bg-green-50 text-green-700 border border-green-200' },
  VERIFICATION_MEMBER:  { label: 'Fact Checker',          badge: 'bg-green-50 text-green-600 border border-green-100' },
  REPORTER_APP_MANAGER: { label: 'App Manager',           badge: 'bg-purple-50 text-purple-700 border border-purple-200' },
  REPORTER_APP_MEMBER:  { label: 'App Moderator',         badge: 'bg-purple-50 text-purple-600 border border-purple-100' },
  REPORTERS_MANAGER:    { label: 'Reporters Manager',     badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
  REPORTERS_MEMBER:     { label: 'Support Member',        badge: 'bg-orange-50 text-orange-600 border border-orange-100' },
};

function RoleBadge({ role }: { role: AdminRole }) {
  const m = ROLE_META[role];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold ${m.badge}`}>{m.label}</span>;
}

// ─── Form schema ─────────────────────────────────────────────────────────────

const createSchema = z.object({
  name:      z.string().min(2, 'At least 2 characters'),
  email:     z.string().email('Invalid email'),
  password:  z.string().min(8, 'Min 8 characters'),
  adminRole: z.string().min(1, 'Select a role') as z.ZodType<AdminRole>,
  team:      z.string().optional() as z.ZodType<TeamType | undefined>,
});

const editSchema = z.object({
  name:      z.string().min(2, 'At least 2 characters'),
  adminRole: z.string().min(1) as z.ZodType<AdminRole>,
  password:  z.string().optional(),
  isActive:  z.boolean().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm   = z.infer<typeof editSchema>;

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-2xs' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} rounded-full bg-red flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function MemberRow({
  member, team, currentAdminId, onEdit, onDelete, onToggleActive,
}: {
  member: Admin;
  team: TeamDef;
  currentAdminId?: string;
  onEdit: (a: Admin) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isManager = member.adminRole === team.managerRole;
  const isMe = member.id === currentAdminId;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-page transition-colors group">
      <div className="relative">
        <Avatar name={member.name} />
        {isManager && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
            <Star size={8} className="text-yellow-800 fill-yellow-800" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-primary">
            {member.name}
            {isMe && <span className="text-2xs text-text-muted font-normal ml-1">(you)</span>}
          </p>
          <RoleBadge role={member.adminRole} />
          {member.isActive === false && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-gray-100 text-gray-500">Inactive</span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5 truncate">{member.email}</p>
      </div>
      <div className="text-2xs text-text-muted hidden sm:block whitespace-nowrap">
        {member.lastLoginAt ? format(new Date(member.lastLoginAt), 'dd MMM HH:mm') : 'Never logged in'}
      </div>
      {!isMe && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 w-44">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(member); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-primary hover:bg-page"
                >
                  <Edit2 size={12} /> Edit Account
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onToggleActive(member.id, !(member.isActive !== false)); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-primary hover:bg-page"
                >
                  {member.isActive !== false ? <Ban size={12} /> : <UserCheck size={12} />}
                  {member.isActive !== false ? 'Deactivate' : 'Activate'}
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(member.id); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-status-red hover:bg-red/5"
                >
                  <Trash2 size={12} /> Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TeamCard({
  team, members, currentAdminId, onAddMember, onEdit, onDelete, onToggleActive,
}: {
  team: TeamDef;
  members: Admin[];
  currentAdminId?: string;
  onAddMember: (team: TeamDef) => void;
  onEdit: (a: Admin) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const manager = members.find(m => m.adminRole === team.managerRole);
  const teamMembers = members.filter(m => m.adminRole === team.memberRole);

  return (
    <div className={`card overflow-hidden border-l-4 ${team.borderColor}`}>
      {/* Team header */}
      <div
        className="card-header cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${team.bgColor} ${team.color}`}>
            {team.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
              {team.label}
              <span className={`text-2xs font-medium px-1.5 py-0.5 rounded ${team.bgColor} ${team.color}`}>
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </p>
            <p className="text-xs text-text-muted mt-0.5">{team.labelTa} — {team.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddMember(team); }}
            className={`btn text-xs px-3 py-1.5 rounded border ${team.borderColor} ${team.color} ${team.bgColor} hover:opacity-80`}
          >
            <UserPlus size={13} /> Add Member
          </button>
          {expanded ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div>
          {/* Permissions strip */}
          <div className="px-4 py-2 bg-page border-b border-border flex flex-wrap gap-2">
            {team.permissions.map(p => (
              <span key={p} className="text-2xs text-text-muted bg-surface border border-border px-2 py-0.5 rounded">
                ✓ {p}
              </span>
            ))}
          </div>

          {/* Manager section */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-2xs font-semibold uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1.5">
              <Star size={10} className="fill-yellow-400 text-yellow-400" /> {team.managerLabel}
            </p>
          </div>
          {manager ? (
            <MemberRow
              member={manager} team={team} currentAdminId={currentAdminId}
              onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
            />
          ) : (
            <div className="px-4 pb-3">
              <button
                onClick={() => onAddMember(team)}
                className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-lg text-xs text-text-muted hover:border-gray-300 hover:text-text-secondary transition-colors"
              >
                <UserPlus size={14} className="mx-auto" />
                <span>Assign a {team.managerLabel}</span>
              </button>
            </div>
          )}

          {/* Members section */}
          {teamMembers.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 border-t border-border">
                <p className="text-2xs font-semibold uppercase tracking-widest text-text-muted mb-1">
                  {team.memberLabel}s ({teamMembers.length})
                </p>
              </div>
              <div className="divide-y divide-border">
                {teamMembers.map(m => (
                  <MemberRow
                    key={m.id} member={m} team={team} currentAdminId={currentAdminId}
                    onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
                  />
                ))}
              </div>
            </>
          )}

          {teamMembers.length === 0 && manager && (
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <p className="text-xs text-text-muted text-center py-3">
                No {team.memberLabel.toLowerCase()}s yet —{' '}
                <button onClick={() => onAddMember(team)} className="text-red hover:underline">add one</button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { admin: currentAdmin } = useAuthStore();
  const qc = useQueryClient();
  const [createTeam, setCreateTeam] = useState<TeamDef | null>(null);   // which team to add to
  const [createRole, setCreateRole] = useState<'manager' | 'member'>('member');
  const [showSysCreate, setShowSysCreate] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => apiGet<{ data: Admin[] }>('/admin/accounts'),
  });
  const allAdmins = data?.data ?? [];

  const sysAdmins  = allAdmins.filter(a => a.adminRole === 'SUPER_ADMIN' || a.adminRole === 'ADMIN');

  function membersForTeam(team: TeamDef) {
    return allAdmins.filter(a => a.adminRole === team.managerRole || a.adminRole === team.memberRole);
  }

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const editForm   = useForm<EditForm>({   resolver: zodResolver(editSchema) });

  const createMutation = useMutation({
    mutationFn: (p: CreateForm) => apiPost('/admin/accounts', p),
    onSuccess: () => {
      toast.success('Account created');
      qc.invalidateQueries({ queryKey: ['admins'] });
      setCreateTeam(null); setShowSysCreate(false);
      createForm.reset();
    },
    onError: () => toast.error('Failed to create account'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EditForm }) => apiPatch(`/admin/accounts/${id}`, payload),
    onSuccess: () => {
      toast.success('Account updated');
      qc.invalidateQueries({ queryKey: ['admins'] });
      setEditing(null);
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/accounts/${id}`),
    onSuccess: () => {
      toast.success('Account deleted');
      qc.invalidateQueries({ queryKey: ['admins'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPatch(`/admin/accounts/${id}`, { isActive }),
    onSuccess: () => { toast.success('Account updated'); qc.invalidateQueries({ queryKey: ['admins'] }); },
    onError: () => toast.error('Failed to update'),
  });

  function openTeamAdd(team: TeamDef, role: 'manager' | 'member' = 'member') {
    setCreateTeam(team);
    setCreateRole(role);
    const adminRole = role === 'manager' ? team.managerRole : team.memberRole;
    createForm.reset({ adminRole, team: team.id });
  }

  function openEdit(a: Admin) {
    setEditing(a);
    editForm.reset({ name: a.name, adminRole: a.adminRole, password: '', isActive: a.isActive !== false });
  }

  if (currentAdmin?.adminRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={48} className="mb-3" />
        <p className="text-lg font-medium text-gray-600">Access Restricted</p>
        <p className="text-sm mt-1">Only Super Admins can manage accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {TEAMS.map(t => {
          const m = membersForTeam(t);
          const mgr = m.find(a => a.adminRole === t.managerRole);
          return (
            <div key={t.id} className={`card card-body flex items-start gap-3 border-l-4 ${t.borderColor}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.bgColor} ${t.color}`}>
                {t.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{t.label}</p>
                <p className="stat-value text-lg mt-0.5">{m.length}</p>
                <p className="text-2xs text-text-muted mt-0.5">
                  {mgr ? `Manager: ${mgr.name}` : '⚠ No manager'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System accounts */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-red" />
            <span className="section-title">System Accounts</span>
            <span className="text-2xs text-text-muted bg-page px-2 py-0.5 rounded border border-border">{sysAdmins.length}</span>
          </div>
          <button onClick={() => setShowSysCreate(true)} className="btn-primary text-xs px-3 py-1.5">
            <UserPlus size={13} /> Add Admin
          </button>
        </div>
        {sysAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-text-muted">
            <User size={22} className="mb-1" />
            <p className="text-xs">No system admins</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sysAdmins.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-page group transition-colors">
                <Avatar name={a.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-text-primary">
                      {a.name}
                      {a.id === currentAdmin?.id && <span className="text-2xs text-text-muted ml-1 font-normal">(you)</span>}
                    </p>
                    <RoleBadge role={a.adminRole} />
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{a.email}</p>
                </div>
                <p className="text-2xs text-text-muted hidden sm:block whitespace-nowrap">
                  {a.lastLoginAt ? format(new Date(a.lastLoginAt), 'dd MMM HH:mm') : 'Never'}
                </p>
                {a.id !== currentAdmin?.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className="btn-ghost p-1.5 rounded"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteId(a.id)} className="btn-ghost p-1.5 rounded text-status-red hover:bg-red/5"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team cards */}
      {TEAMS.map(team => (
        <TeamCard
          key={team.id}
          team={team}
          members={membersForTeam(team)}
          currentAdminId={currentAdmin?.id}
          onAddMember={(t) => openTeamAdd(t)}
          onEdit={openEdit}
          onDelete={setDeleteId}
          onToggleActive={(id, isActive) => toggleActiveMutation.mutate({ id, isActive })}
        />
      ))}

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      )}

      {/* ── Create Modal (Team) ─────────────────────────────────────────── */}
      {createTeam && (
        <Modal title={`Add to ${createTeam.label}`} onClose={() => setCreateTeam(null)}>
          <div className={`flex items-center gap-3 p-3 rounded-lg ${createTeam.bgColor} ${createTeam.borderColor} border mb-4`}>
            <div className={`${createTeam.color}`}>{createTeam.icon}</div>
            <div>
              <p className={`text-sm font-semibold ${createTeam.color}`}>{createTeam.label}</p>
              <p className="text-xs text-text-muted">{createTeam.description}</p>
            </div>
          </div>

          {/* Manager / Member toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setCreateRole('manager'); createForm.setValue('adminRole', createTeam.managerRole); }}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                createRole === 'manager'
                  ? `${createTeam.bgColor} ${createTeam.borderColor} ${createTeam.color}`
                  : 'border-border text-text-secondary hover:bg-page'
              }`}
            >
              <Star size={12} className="inline mr-1" />
              {createTeam.managerLabel}
            </button>
            <button
              type="button"
              onClick={() => { setCreateRole('member'); createForm.setValue('adminRole', createTeam.memberRole); }}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                createRole === 'member'
                  ? `${createTeam.bgColor} ${createTeam.borderColor} ${createTeam.color}`
                  : 'border-border text-text-secondary hover:bg-page'
              }`}
            >
              <User size={12} className="inline mr-1" />
              {createTeam.memberLabel}
            </button>
          </div>

          <CreateAccountFields
            form={createForm}
            showPass={showPass}
            setShowPass={setShowPass}
            onSubmit={(v) => createMutation.mutate(v)}
            isPending={createMutation.isPending}
            onCancel={() => setCreateTeam(null)}
          />
        </Modal>
      )}

      {/* ── Create Modal (System Admin) ─────────────────────────────────── */}
      {showSysCreate && (
        <Modal title="Add System Account" onClose={() => setShowSysCreate(false)}>
          <div className="mb-4">
            <label className="label">Role</label>
            <div className="flex gap-2">
              {(['SUPER_ADMIN', 'ADMIN'] as AdminRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => createForm.setValue('adminRole', r)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    createForm.watch('adminRole') === r
                      ? 'bg-red/10 border-red/30 text-red'
                      : 'border-border text-text-secondary hover:bg-page'
                  }`}
                >
                  {r === 'SUPER_ADMIN' ? <><Crown size={12} className="inline mr-1" />Super Admin</> : <><Shield size={12} className="inline mr-1" />Admin</>}
                </button>
              ))}
            </div>
          </div>
          <CreateAccountFields
            form={createForm}
            showPass={showPass}
            setShowPass={setShowPass}
            onSubmit={(v) => createMutation.mutate(v)}
            isPending={createMutation.isPending}
            onCancel={() => setShowSysCreate(false)}
          />
        </Modal>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {editing && (
        <Modal title="Edit Account" onClose={() => setEditing(null)}>
          <form onSubmit={editForm.handleSubmit((v) => editMutation.mutate({ id: editing.id, payload: v }))} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...editForm.register('name')} className="input-field" />
              {editForm.formState.errors.name && <p className="mt-1 text-xs text-status-red">{editForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="label">New Password <span className="normal-case font-normal text-text-muted">(leave blank to keep current)</span></label>
              <input {...editForm.register('password')} type="password" className="input-field" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Active Account</p>
                <p className="text-xs text-text-muted">Inactive accounts cannot log in</p>
              </div>
              <button
                type="button"
                onClick={() => editForm.setValue('isActive', !editForm.watch('isActive'))}
                className={`relative w-11 h-6 rounded-full transition-colors ${editForm.watch('isActive') !== false ? 'bg-red' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.watch('isActive') !== false ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={editMutation.isPending} className="btn-primary flex-1">
                {editMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-status-red" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Delete Account</p>
                <p className="text-sm text-text-muted">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="btn-danger flex-1">
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function CreateAccountFields({
  form, showPass, setShowPass, onSubmit, isPending, onCancel,
}: {
  form: ReturnType<typeof useForm<CreateForm>>;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  onSubmit: (v: CreateForm) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input {...form.register('name')} className="input-field" placeholder="e.g. Ravi Kumar" />
        {form.formState.errors.name && <p className="mt-1 text-xs text-status-red">{form.formState.errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Email Address</label>
        <input {...form.register('email')} type="email" className="input-field" placeholder="ravi@agnisiragu.com" />
        {form.formState.errors.email && <p className="mt-1 text-xs text-status-red">{form.formState.errors.email.message}</p>}
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input {...form.register('password')} type={showPass ? 'text' : 'password'} className="input-field pr-10" placeholder="Min 8 characters" />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {form.formState.errors.password && <p className="mt-1 text-xs text-status-red">{form.formState.errors.password.message}</p>}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Create Account
        </button>
      </div>
    </form>
  );
}
