import { getAccessToken, tryRefresh } from './auth';
import type { ScheduleEvent } from './data';

export type Schedule = Record<number, ScheduleEvent[]>;

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const makeHeaders = (): HeadersInit => ({
    ...init?.headers,
    Authorization: `Bearer ${getAccessToken() ?? ''}`,
  });

  let res = await fetch(input, { ...init, headers: makeHeaders() });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (!refreshed) {
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Session expired');
    }
    res = await fetch(input, { ...init, headers: makeHeaders() });
  }

  return res;
}

export async function bulkUpdateEvents(
  updates: Array<{ id: number; h: number; m: number; dur: number }>
): Promise<void> {
  const res = await apiFetch('/api/schedule/bulk', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update events');
}

export async function fetchSchedule(): Promise<Schedule> {
  const res = await apiFetch('/api/schedule');
  if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status}`);
  const raw = await res.json() as Record<string, ScheduleEvent[]>;
  const schedule: Schedule = {};
  for (const [k, v] of Object.entries(raw)) {
    schedule[Number(k)] = v;
  }
  return schedule;
}
