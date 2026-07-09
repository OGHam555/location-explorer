import type { LatLng, Spot } from '@/types/spot';

// バックエンドへのリクエストは常に同一オリジンの /api/... を叩く。
// 実際のバックエンドへの中継は next.config.js の rewrites が担うため、
// ここではバックエンドのホスト名・ポートを一切意識しない。
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getJson<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE}${path}?${new URLSearchParams(params).toString()}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new ApiError(`リクエストに失敗しました (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}

// GET /api/spots?lat=&lng=&radius= — 半径内スポットの取得（PostGISでDB側絞り込み済み）。
export function fetchSpots(center: LatLng, radiusKm: number, signal?: AbortSignal): Promise<Spot[]> {
  return getJson<Spot[]>('/spots', {
    lat: String(center.lat),
    lng: String(center.lng),
    radius: String(radiusKm),
  }, signal);
}

// GET /api/geocode?lat=&lng= — 座標→住所（BE側でGoogle APIキャッシュ済み）。
export async function fetchAddress(center: LatLng, signal?: AbortSignal): Promise<string | null> {
  const { address } = await getJson<{ address: string | null }>('/geocode', {
    lat: String(center.lat),
    lng: String(center.lng),
  }, signal);
  return address;
}
