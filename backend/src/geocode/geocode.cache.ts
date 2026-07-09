import { Injectable } from '@nestjs/common';

// 座標→住所のキャッシュ。
// 地図移動中は「一度取得した座標の近く」を何度も問い合わせしがちなため、
// 緯度・経度を小数点3桁（約100m格子）に丸めてキーにすることで、
// わずかに異なる座標でも同一の住所結果を再利用できるようにする。
// 住所は時間が経っても変わらない前提のため、TTLは設けずプロセス生存中は保持する。
const PRECISION = 3;

@Injectable()
export class GeocodeCache {
  private readonly cache = new Map<string, string | null>();

  private buildKey(lat: number, lng: number): string {
    return `${lat.toFixed(PRECISION)},${lng.toFixed(PRECISION)}`;
  }

  get(lat: number, lng: number): { hit: true; address: string | null } | { hit: false } {
    const key = this.buildKey(lat, lng);
    if (!this.cache.has(key)) {
      return { hit: false };
    }
    return { hit: true, address: this.cache.get(key) ?? null };
  }

  set(lat: number, lng: number, address: string | null): void {
    this.cache.set(this.buildKey(lat, lng), address);
  }
}
