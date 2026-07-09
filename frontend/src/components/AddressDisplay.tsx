import { Spinner } from './Spinner';

interface AddressDisplayProps {
  address: string | null;
  loading: boolean;
  error: string | null;
}

// 地図中心地点の住所を表示するだけの見た目コンポーネント。
// デバウンス・API呼び出しはすべて useGeocode 側の責務であり、
// ここでは渡された状態（address/loading/error）をそのまま出し分けるだけにする。
export function AddressDisplay({ address, loading, error }: AddressDisplayProps) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-sm shadow">
      <span className="shrink-0 font-medium text-gray-500">現在地点:</span>
      {loading ? (
        <span className="flex items-center gap-2 text-gray-400">
          <Spinner />
          取得中...
        </span>
      ) : error ? (
        <span className="text-red-500">{error}</span>
      ) : (
        <span className="truncate text-gray-800">{address ?? '住所が見つかりませんでした'}</span>
      )}
    </div>
  );
}
