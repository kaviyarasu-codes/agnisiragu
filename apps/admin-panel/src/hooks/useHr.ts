// src/hooks/useHr.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../lib/api';
import type {
  MyHrAccess, DailyAttendanceEntry, MonthlyAttendanceEntry,
  MemberAttendanceDetail, SalaryEntry, AccessGrantEntry,
} from '../types';

// Used by Sidebar (to decide whether to show the Workforce link at all) and
// by WorkforcePage (to decide whether to show the edit controls / Access
// Control tab). A 403 from any /hr/* route means "no access" rather than a
// real error, so this is treated as canView:false rather than surfaced.
export function useMyHrAccess() {
  return useQuery({
    queryKey: ['hr', 'my-access'],
    queryFn: () => apiGet<{ data: MyHrAccess }>('/hr/my-access'),
    staleTime: 60_000,
  });
}

export function useDailyAttendance(date: string) {
  return useQuery({
    queryKey: ['hr', 'attendance', 'daily', date],
    queryFn: () => apiGet<{ data: DailyAttendanceEntry[] }>('/hr/attendance', { date }),
  });
}

export function useMonthlyAttendance(month: number, year: number) {
  return useQuery({
    queryKey: ['hr', 'attendance', 'monthly', month, year],
    queryFn: () => apiGet<{ data: MonthlyAttendanceEntry[] }>('/hr/attendance/monthly', { month, year }),
  });
}

export function useMemberAttendanceDetail(adminId: string | null, month: number, year: number) {
  return useQuery({
    queryKey: ['hr', 'attendance', 'member', adminId, month, year],
    queryFn: () => apiGet<{ data: MemberAttendanceDetail }>(`/hr/attendance/member/${adminId}`, { month, year }),
    enabled: !!adminId,
  });
}

export function useSalary(month: number, year: number) {
  return useQuery({
    queryKey: ['hr', 'salary', month, year],
    queryFn: () => apiGet<{ data: SalaryEntry[]; canEdit: boolean }>('/hr/salary', { month, year }),
  });
}

interface UpsertSalaryPayload {
  adminId: string;
  month: number;
  year: number;
  amount: number;
  status: 'PENDING' | 'PAID';
  notes?: string;
}

export function useUpsertSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, ...body }: UpsertSalaryPayload) =>
      apiPatch<{ data: SalaryEntry }>(`/hr/salary/${adminId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'salary'] }),
  });
}

export function useAccessGrants(enabled: boolean) {
  return useQuery({
    queryKey: ['hr', 'access-grants'],
    queryFn: () => apiGet<{ data: AccessGrantEntry[] }>('/hr/access-grants'),
    enabled,
  });
}

export function useUpsertAccessGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, canView, canEdit }: { adminId: string; canView: boolean; canEdit: boolean }) =>
      apiPatch(`/hr/access-grants/${adminId}`, { canView, canEdit }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'access-grants'] }),
  });
}
