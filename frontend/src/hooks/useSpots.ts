import { useEffect, useState } from 'react';
import { ApiError, fetchSpots } from '@/lib/api';
import type { LatLng, Spot } from '@/types/spot';

// スライダー操作中は radius が連続して変化するため、操作が落ち着いてから
// 1回だけ /api/spots を呼び出す（技術仕様書: 中心・半径の変更時のみ発火）。
const DEBOUNCE_MS = 400;

interface UseSpotsResult {
  spots: Spot[];
  loading: boolean;
  error: string | null;
}

// 中心座標・半径の変化を検知し、デバウンスしてから半径検索APIを呼び出す。
// コンポーネントはこのフックが返す spots をそのまま地図・リストへ渡すだけでよく、
// 「いつAPIを呼ぶか」の判断ロジックを持たない。
export function useSpots(center: LatLng, radiusKm: number): UseSpotsResult {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      fetchSpots(center, radiusKm, controller.signal)
        .then((result) => {
          if (!cancelled) setSpots(result);
        })
        .catch((err: unknown) => {
          if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
          setError(err instanceof ApiError ? err.message : 'スポットの取得に失敗しました');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [center.lat, center.lng, radiusKm]);

  return { spots, loading, error };
}
