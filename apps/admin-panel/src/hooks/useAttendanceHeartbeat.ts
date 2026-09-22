// src/hooks/useAttendanceHeartbeat.ts
import { useEffect, useRef } from 'react';
import { apiPatch } from '../lib/api';

const HEARTBEAT_INTERVAL_MS = 60_000;
// No real interaction (mouse/keyboard/scroll/touch) for this long counts as
// "not using the panel" — the admin is force-logged-out, same as Layout.tsx's
// manual Logout button.
const IDLE_TIMEOUT_MS = 30 * 60_000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

// Powers two things off the same "is this admin actually using the panel
// right now" signal (see backend/src/hr/hr.service.ts#heartbeat for the
// attendance/active-hours math):
//
//  1. Attendance heartbeat — a ping only goes out when there's been real
//     interaction in the last ~60s, so an idle tab left open in the
//     background no longer inflates "Active Hours"; it only counts genuine
//     active time, matching First Login / Last Logout / Total Hours shown
//     on the Workforce page.
//  2. Idle auto-logout — 30 minutes with zero interaction fires
//     onIdleTimeout (Layout.tsx signs the admin out and redirects to
//     /login), so a laptop left open and unattended doesn't leave a live
//     session sitting around.
//
// Mounted once in Layout.tsx, which only renders for authenticated routes,
// so neither of these ever runs on the login page itself.
export function useAttendanceHeartbeat(onIdleTimeout: () => void) {
  const lastActivityRef = useRef(Date.now());
  const idleFiredRef = useRef(false);
  const onIdleTimeoutRef = useRef(onIdleTimeout);
  onIdleTimeoutRef.current = onIdleTimeout;

  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
      idleFiredRef.current = false;
    };
    ACTIVITY_EVENTS.forEach((ev) => document.addEventListener(ev, markActive, { passive: true }));

    const tick = () => {
      const idleFor = Date.now() - lastActivityRef.current;

      if (idleFor >= IDLE_TIMEOUT_MS) {
        if (!idleFiredRef.current) {
          idleFiredRef.current = true;
          onIdleTimeoutRef.current();
        }
        return;
      }

      // Only ping while the tab is visible AND there's been activity within
      // this interval — an open-but-untouched tab stops accumulating hours
      // (and stops resetting the idle clock) even before the 30-minute
      // auto-logout kicks in.
      if (document.visibilityState === 'visible' && idleFor < HEARTBEAT_INTERVAL_MS) {
        apiPatch('/hr/heartbeat').catch(() => {});
      }
    };

    tick();
    const id = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => {
      clearInterval(id);
      ACTIVITY_EVENTS.forEach((ev) => document.removeEventListener(ev, markActive));
    };
  }, []);
}
