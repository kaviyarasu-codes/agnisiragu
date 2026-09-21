// src/hooks/useTickets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '../lib/api';
import type { Ticket, TicketPriority, TicketStatusValue } from '../types';

export function useMyTickets() {
  return useQuery({
    queryKey: ['tickets', 'mine'],
    queryFn: () => apiGet<{ data: Ticket[] }>('/admin/tickets/mine'),
  });
}

// SUPER_ADMIN/ADMIN only — the backend 403s for anyone else, so this is
// only ever called from TicketsPage, which is itself gated to those roles.
export function useAllTickets(status?: TicketStatusValue | 'ALL') {
  return useQuery({
    queryKey: ['tickets', 'all', status],
    queryFn: () => apiGet<{ data: Ticket[] }>('/admin/tickets', status && status !== 'ALL' ? { status } : undefined),
  });
}

interface CreateTicketPayload {
  title: string;
  description: string;
  priority?: TicketPriority;
  attachmentUrls?: string[];
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => apiPost<{ data: Ticket }>('/admin/tickets', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolutionNote }: { id: string; status?: TicketStatusValue; resolutionNote?: string }) =>
      apiPatch<{ data: Ticket }>(`/admin/tickets/${id}`, { status, resolutionNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
