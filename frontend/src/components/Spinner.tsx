interface SpinnerProps {
  size?: 'sm' | 'md';
}

// 地図移動中・住所取得中など、ローディング状態を示すための共通スピナー。
// hooks側のloading状態を表示するだけの純粋な見た目コンポーネント。
export function Spinner({ size = 'sm' }: SpinnerProps) {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <span
      role="status"
      aria-label="読み込み中"
      className={`inline-block ${dimension} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
    />
  );
}
