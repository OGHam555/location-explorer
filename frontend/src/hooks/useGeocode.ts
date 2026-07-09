import { useEffect, useState } from 'react';
import { ApiError, fetchAddress } from '@/lib/api';
import type { LatLng } from '@/types/spot';

// 「地図移動が止まってから一定時間後にAPIを呼ぶ」デバウンス（技術仕様書）。
// スポット検索より短めにし、住所表示の追従を「リアルタイムに近い高頻度」に見せる。
const DEBOUNCE_MS = 500;

interface UseGeocodeResult {
  address: string | null;
  loading: boolean;
  error: string | null;
}

// 地図中心座標の変化をデバウンスしてから逆ジオコーディングAPIを呼び出す。
// loading は座標が変わった瞬間（デバウンス待ち中）からtrueにする。これにより
// 「地図移動中・住所取得中は常にスピナーを表示する」要件を、デバウンス待機を
// 含めた見た目上の一つの状態として満たす。
// キャッシュはBE側（geocode.cache.ts）に集約しているため、ここでは持たない。
export function useGeocode(center: LatLng): UseGeocodeResult {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      fetchAddress(center, controller.signal)
        .then((result) => {
          if (!cancelled) setAddress(result);
        })
        .catch((err: unknown) => {
          if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
          setError(err instanceof ApiError ? err.message : '住所の取得に失敗しました');
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
  }, [center.lat, center.lng]);

  return { address, loading, error };
}
