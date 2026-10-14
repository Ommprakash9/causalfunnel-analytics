const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `API request failed with status ${res.status}`);
  }

  return data.data;
}

export const api = {
  getOverview: () =>
    fetchApi<import('@/types').OverviewMetrics>('/overview'),

  getSessions: (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return fetchApi<import('@/types').PaginatedSessions>(`/sessions?${params}`);
  },

  getSessionEvents: (sessionId: string) =>
    fetchApi<{ session_id: string; events: import('@/types').EventData[]; total: number }>(
      `/sessions/${encodeURIComponent(sessionId)}/events`
    ),

  getPages: () =>
    fetchApi<{ pages: string[] }>('/pages'),

  getHeatmap: (pageUrl: string, limit = 1000) => {
    const params = new URLSearchParams({ page_url: pageUrl, limit: String(limit) });
    return fetchApi<import('@/types').HeatmapData>(`/heatmap?${params}`);
  },

  getHealth: () =>
    fetchApi<{ status: string; database: string }>('/health'),
};
