// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import type { Task, TaskStatus, AssignableAdmin } from '../types';

export function useMyTasks() {
  return useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => apiGet<{ data: Task[] }>('/admin/tasks/mine'),
  });
}

export function useAssignedByMe() {
  return useQuery({
    queryKey: ['tasks', 'assigned-by-me'],
    queryFn: () => apiGet<{ data: Task[] }>('/admin/tasks/assigned-by-me'),
  });
}

// Empty list means the current admin has no assignment rights (a member, or
// a manager whose team has no member role) — frontend uses this to hide the
// "Assign Task" button rather than showing it and failing on submit.
export function useAssignableUsers() {
  return useQuery({
    queryKey: ['tasks', 'assignable-users'],
    queryFn: () => apiGet<{ data: AssignableAdmin[] }>('/admin/tasks/assignable-users'),
  });
}

interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedToId: string;
  dueDate?: string;
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => apiPost<{ data: Task }>('/admin/tasks', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiPatch<{ data: Task }>(`/admin/tasks/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/admin/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
