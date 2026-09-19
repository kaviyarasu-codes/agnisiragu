// src/lib/fetchWithTimeout.ts
// Plain fetch() never times out on its own — a hung request (dead backend,
// bad network) leaves the caller's loading state spinning forever with no
// way to recover. Every fetch call in this app (LoginModal, CommentsSection,
// lib/api.ts, authFetch.ts) goes through this instead of raw fetch().

const DEFAULT_TIMEOUT_MS = 15000;

export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
