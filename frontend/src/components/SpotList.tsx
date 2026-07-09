import { getCategoryColor } from '@/lib/categoryColors';
import type { Spot } from '@/types/spot';
import { Spinner } from './Spinner';

interface SpotListProps {
  spots: Spot[];
  loading: boolean;
  error: string | null;
}

// 地図と同じ spots 配列をそのままリスト表示するだけの見た目コンポーネント
// （単一データソースによるFE連動）。カテゴリごとに分類し、マーカーと同じ色を
// 見出しに添えることで、地図の色分けとリストを対応づけやすくする。
function groupByCategory(spots: Spot[]): Map<string, Spot[]> {
  const groups = new Map<string, Spot[]>();
  for (const spot of spots) {
    const list = groups.get(spot.category) ?? [];
    list.push(spot);
    groups.set(spot.category, list);
  }
  return groups;
}

export function SpotList({ spots, loading, error }: SpotListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-400">
        <Spinner />
        スポットを検索中...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">{error}</div>;
  }

  if (spots.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        付近に該当するスポットが存在しません
      </div>
    );
  }

  const groups = groupByCategory(spots);

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto">
      {[...groups.entries()].map(([category, categorySpots]) => (
        <div key={category} className="p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getCategoryColor(category) }}
            />
            {category}
            <span className="text-xs font-normal text-gray-400">({categorySpots.length})</span>
          </div>
          <ul className="space-y-1.5">
            {categorySpots.map((spot) => (
              <li key={spot.id} className="text-sm">
                <div className="font-medium text-gray-800">{spot.name}</div>
                {spot.address && <div className="text-xs text-gray-400">{spot.address}</div>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
