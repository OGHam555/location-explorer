import type { LatLng } from '@/types/spot';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// 2点間の実距離(m)をHaversine公式で算出する。
// 経度1度あたりの距離は緯度によって変わるため、単純な緯度経度の差では
// 「わずかな移動」の判定基準が場所ごとにブレてしまう。実距離で比較することで
// 全国どの地点でも同じ基準（メートル）で移動量を判定できるようにする。
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

// BE側の逆ジオコーディングキャッシュ（geocode.cache.ts）は座標を小数点3桁
// （≈100m格子）に丸めてキー化している。同じ格子内に留まる移動はどうせ同じ
// キャッシュ結果が返るだけなので、FE側でもこの粒度を「わずかな移動」の基準とし、
// 格子内に収まる間は再フェッチ自体を発火させない。
export const MOVE_THRESHOLD_METERS = 100;
