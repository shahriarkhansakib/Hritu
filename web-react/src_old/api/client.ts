import { Metric, TrendDataResponse, NarrativeResponse } from './types/api';

/**
 * API Client.
 * Note: Thanks to Vite proxy, we just call '/api/...' 
 * and it routes to localhost:8000 automatically without CORS issues.
 */

export async function fetchMetrics(): Promise<Metric[]> {
  const res = await fetch('/api/metrics');
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchTrendData(
  lat: number,
  lon: number,
  metric: string,
  startYear = 1981,
  endYear = 2026,
  interval = 'annual'
): Promise<TrendDataResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    metric,
    start_year: startYear.toString(),
    end_year: endYear.toString(),
    interval
  });

  const res = await fetch(`/api/data?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'API Error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function generateNarrative(trendData: TrendDataResponse): Promise<NarrativeResponse> {
  const res = await fetch('/api/story/1/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trendData),
  });
  if (!res.ok) {
    throw new Error('Failed to generate narrative');
  }
  return res.json();
}
