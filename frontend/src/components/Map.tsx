'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useCallback, useRef } from 'react';
import { getCategoryColor } from '@/lib/categoryColors';
import type { LatLng, Spot } from '@/types/spot';

interface MapProps {
  initialCenter: LatLng;
  center: LatLng;
  address: string | null;
  spots: Spot[];
  onCenterChanged: (center: LatLng) => void;
}

const containerStyle = { width: '100%', height: '100%' };

// 地図表示専用のキー。逆ジオコーディング用キー（GOOGLE_MAPS_API_KEY）は
// バックエンドのみが保持し、フロントには絶対に渡さない。
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function buildMarkerIcon(color: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 8,
  };
}

// 地図表示・マーカー描画に専念する見た目コンポーネント。
// 中心座標や半径のstate管理、API呼び出しはpage.tsx側（hooks）が持つ。
// center propは初回描画時のみ使用し、以降はユーザーのドラッグ操作による
// 地図自身の位置を正とする（Reactのstateへ書き戻して再度centerに渡すと
// panTo同士がフィードバックし合うため、意図的に「初期値のみ制御」にしている）。
export function MapView({ initialCenter, center, address, spots, onCenterChanged }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  const mapRef = useRef<google.maps.Map | null>(null);
  const initialCenterRef = useRef(initialCenter);

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // 地図移動が完全に止まった(idle)タイミングでのみ中心座標を通知する。
  // ドラッグ中の毎フレームで通知すると、hooks側の「移動が止まってから呼ぶ」
  // というデバウンスの前提が崩れるため、通知自体をidle単位に間引く。
  const handleIdle = useCallback(() => {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    onCenterChanged({ lat: center.lat(), lng: center.lng() });
  }, [onCenterChanged]);

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
        地図を読み込み中...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={initialCenterRef.current}
      zoom={9}
      onLoad={handleLoad}
      onIdle={handleIdle}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={{ lat: spot.lat, lng: spot.long }}
          title={`${spot.name}（${spot.category}）`}
          icon={buildMarkerIcon(getCategoryColor(spot.category))}
        />
      ))}
      {/* 現在地点（住所表示中の中心座標）マーカー。スポットの色分けドットと見分けが
          つくよう、あえてカスタムアイコンを付けず既定のピン形状のままにしている。 */}
      <Marker position={center} title={address ?? undefined} zIndex={1000} />
    </GoogleMap>
  );
}
