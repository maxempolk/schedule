// Access token lives only in memory — never in localStorage/sessionStorage
let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const ACCESS_TTL_MS = 15 * 60 * 1000;  // 15 min (must match server)
const REFRESH_AHEAD = 60 * 1000;        // refresh 1 min before expiry

export const getAccessToken = (): string | null => accessToken;

function scheduleAutoRefresh(): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    const ok = await tryRefresh();
    if (!ok) window.dispatchEvent(new Event('auth:expired'));
  }, ACCESS_TTL_MS - REFRESH_AHEAD);
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) return false;
    const { accessToken: token } = await res.json() as { accessToken: string };
    accessToken = token;
    scheduleAutoRefresh();
    return true;
  } catch {
    return false;
  }
}

export async function login(loginStr: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginStr, password }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? 'Ошибка входа');
  }
  const { accessToken: token } = await res.json() as { accessToken: string };
  accessToken = token;
  scheduleAutoRefresh();
}
