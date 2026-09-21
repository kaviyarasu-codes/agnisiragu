// src/pages/TicketsPage.tsx
//
// Shared support-ticket pool — visible to SUPER_ADMIN and ADMIN only.
// Managers/Members raise tickets from their My Profile "Support" tab
// (see ProfilePage.tsx); any admin here can pick one up and resolve it.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, LifeBuoy, Shield, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useAllTickets, useUpdateTicket } from '../hooks/useTickets';
import type { Ticket, TicketPriority, TicketStatusValue } from '../types';

const PRIORITY_META: Record<TicketPriority, string> = {
  LOW:    'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH:   'bg-red/10 text-red',
};

const STATUS_META: Record<TicketStatusValue, { label: string; icon: any; cls: string }> = {
  OPEN:        { label: 'Open',        icon: AlertCircle,  cls: 'bg-amber-50 text-amber-700' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock,        cls: 'bg-blue-50 text-blue-700' },
  RESOLVED:    { label: 'Resolved',    icon: CheckCircle2, cls: 'bg-green-50 text-green-700' },
};

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full bg-red flex items-center justify-center flex-shrink-0">
      <span className="text-white text-2xs font-bold">{name?.charAt(0).toUpperCase()}</span>
    </div>
  );
}

const resolveSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
  resolutionNote: z.string().optional(),
});
type ResolveForm = z.infer<typeof resolveSchema>;

function TicketCard({ ticket, onOpen }: { ticket: Ticket; onOpen: (t: Ticket) => void }) {
  const m = STATUS_META[ticket.status];
  const Icon = m.icon;
  return (
    <button onClick={() => onOpen(ticket)} className="card card-body w-full text-left hover:border-red/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={ticket.raisedBy.name} avatarUrl={ticket.raisedBy.avatarUrl} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{ticket.title}</p>
            <p className="text-2xs text-text-muted mt-0.5">
              {ticket.raisedBy.name} · {ticket.raisedBy.adminRole?.replace(/_/g, ' ')} · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded ${PRIORITY_META[ticket.priority]}`}>{ticket.priority}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold ${m.cls}`}><Icon size={10} /> {m.label}</span>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-2 line-clamp-2">{ticket.description}</p>
    </button>
  );
}

export default function TicketsPage() {
  const { admin } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<TicketStatusValue | 'ALL'>('ALL');
  const [active, setActive] = useState<Ticket | null>(null);
  const { data, isLoading, isError, refetch } = useAllTickets(statusFilter);
  const updateTicket = useUpdateTicket();
  const form = useForm<ResolveForm>({ resolver: zodResolver(resolveSchema) });

  if (admin?.adminRole !== 'SUPER_ADMIN' && admin?.adminRole !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Shield size={48} className="mb-3" />
        <p className="text-lg font-medium text-gray-600">Access Restricted</p>
        <p className="text-sm mt-1">Only Admins can view support tickets.</p>
      </div>
    );
  }

  function openTicket(t: Ticket) {
    setActive(t);
    form.reset({ status: t.status, resolutionNote: t.resolutionNote ?? '' });
  }

  function submit(v: ResolveForm) {
    if (!active) return;
    updateTicket.mutate({ id: active.id, ...v }, {
      onSuccess: () => { toast.success('Ticket updated'); setActive(null); },
      onError: () => toast.error('Failed to update ticket'),
    });
  }

  const tickets = data?.data ?? [];
  const openCount = tickets.filter((t) => t.status !== 'RESOLVED').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LifeBuoy size={18} className="text-red" />
          <span className="text-sm text-text-muted">{openCount} open / in progress</span>
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
                statusFilter === s ? 'bg-red/10 border-red/30 text-red' : 'border-border text-text-secondary hover:bg-page'
              }`}>
              {s === 'ALL' ? 'All' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={22} className="animate-spin text-text-muted" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-40 text-text-muted">
          <p className="text-sm text-status-red">Failed to load tickets.</p>
          <button onClick={() => refetch()} className="mt-2 text-xs font-semibold text-red hover:underline">Retry</button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-text-muted">
          <LifeBuoy size={24} className="mb-2" /><p className="text-sm">No tickets here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((t) => <TicketCard key={t.id} ticket={t} onOpen={openTicket} />)}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface">
              <h2 className="text-base font-semibold">{active.title}</h2>
              <button onClick={() => setActive(null)} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-xs text-text-muted">
                Raised by {active.raisedBy.name} ({active.raisedBy.adminRole?.replace(/_/g, ' ')}) · {formatDistanceToNow(new Date(active.createdAt), { addSuffix: true })}
              </div>
              <p className="text-sm text-text-primary">{active.description}</p>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-4 pt-2 border-t border-border">
                <div>
                  <label className="label">Status</label>
                  <select {...form.register('status')} className="input-field">
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="label">Resolution Note <span className="text-text-muted font-normal">(visible to the person who raised it)</span></label>
                  <textarea {...form.register('resolutionNote')} rows={3} className="input-field resize-none" placeholder="How was this handled?" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActive(null)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={updateTicket.isPending} className="btn-primary flex-1">
                    {updateTicket.isPending && <Loader2 size={14} className="animate-spin" />} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
