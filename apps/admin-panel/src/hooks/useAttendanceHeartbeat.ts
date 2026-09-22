// src/hooks/useAttendanceHeartbeat.ts
import { useEffect } from 'react';
import { apiPatch } from '../lib/api';

const HEARTBEAT_INTERVAL_MS = 60_000;

// Powers the Workforce module's "active hours" / daily attendance tracking
// (see backend/src/hr/hr.service.ts#heartbeat) — pings once immediately,
// then every ~60s for as long as this tab stays open. Skipped while the tab
// is hidden/backgrounded (no cross-tab dedup needed since the backend just
// tracks "did we hear from this admin today", not concurrent sessions).
// Mounted once in Layout.tsx, which only renders for authenticated routes,
// so this never runs on the login page.
export function useAttendanceHeartbeat() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== 'visible') return;
      apiPatch('/hr/heartbeat').catch(() => {});
    };
    ping();
    const id = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', ping);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', ping);
    };
  }, []);
}
