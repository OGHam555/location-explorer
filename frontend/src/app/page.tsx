'use client';

import { useCallback, useState } from 'react';
import { AddressDisplay } from '@/components/AddressDisplay';
import { MapView } from '@/components/Map';
import { RadiusSlider } from '@/components/RadiusSlider';
import { SpotList } from '@/components/SpotList';
import { useGeocode } from '@/hooks/useGeocode';
import { useSpots } from '@/hooks/useSpots';
import type { LatLng } from '@/types/spot';

// 初期中心点：東京駅。初期半径：50km（PRD 4章「初期値・パラメータ定義」に準拠）。
const INITIAL_CENTER: LatLng = { lat: 35.681, lng: 139.767 };
const INITIAL_RADIUS_KM = 50;

// ページはstateを保持し、hooksとコンポーネントを繋ぐだけに専念する。
// API呼び出し・デバウンスの判断はすべてhooks（useSpots/useGeocode）に委譲し、
// Map/SpotList/RadiusSlider/AddressDisplayは受け取った値を表示するだけにする。
export default function Home() {
  const [center, setCenter] = useState<LatLng>(INITIAL_CENTER);
  const [radiusKm, setRadiusKm] = useState(INITIAL_RADIUS_KM);

  const { spots, loading: spotsLoading, error: spotsError } = useSpots(center, radiusKm);
  const { address, loading: addressLoading, error: addressError } = useGeocode(center);

  // 地図がidleになるたびに呼ばれる。ここでは受け取った座標をstateへ反映するだけで、
  // 「いつAPIを呼ぶか」はuseSpots/useGeocode内のデバウンスに任せる。
  const handleCenterChanged = useCallback((newCenter: LatLng) => {
    setCenter(newCenter);
  }, []);

  return (
    <main className="flex h-screen w-screen flex-col">
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800">Location Explorer</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <MapView initialCenter={INITIAL_CENTER} spots={spots} onCenterChanged={handleCenterChanged} />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3 sm:max-w-xs">
            <div className="pointer-events-auto">
              <AddressDisplay address={address} loading={addressLoading} error={addressError} />
            </div>
            <div className="pointer-events-auto">
              <RadiusSlider value={radiusKm} onChange={setRadiusKm} />
            </div>
          </div>
        </div>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
          <SpotList spots={spots} loading={spotsLoading} error={spotsError} />
        </aside>
      </div>
    </main>
  );
}
