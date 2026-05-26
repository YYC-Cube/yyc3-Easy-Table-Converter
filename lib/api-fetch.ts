const isStaticExport = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<{ ok: boolean; data: T | null; error?: string }> {
  if (isStaticExport && url.startsWith('/api/')) {
    return { ok: false, data: null, error: 'API not available in static mode' };
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      return { ok: false, data: null, error: `HTTP ${response.status}` };
    }

    const text = await response.text();
    if (!text) {
      return { ok: true, data: null };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, data };
    } catch {
      return { ok: false, data: null, error: 'Invalid JSON response' };
    }
  } catch (err) {
    return { ok: false, data: null, error: err instanceof Error ? err.message : 'Network error' };
  }
}
