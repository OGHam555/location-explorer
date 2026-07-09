interface RadiusSliderProps {
  value: number;
  onChange: (radiusKm: number) => void;
  min?: number;
  max?: number;
}

// 半径(km)を変更するスライダー。値の変化をそのまま親へ伝えるだけで、
// 「変更時のみAPIを呼ぶ」ためのデバウンスは useSpots 側の責務とする
// （表示用の値はドラッグに合わせて即座に更新したいため、ここでは間引かない）。
export function RadiusSlider({ value, onChange, min = 10, max = 200 }: RadiusSliderProps) {
  return (
    <div className="rounded-md bg-white/95 px-3 py-2 shadow">
      <div className="mb-1 flex items-center justify-between text-sm">
        <label htmlFor="radius-slider" className="font-medium text-gray-500">
          検索半径
        </label>
        <span className="font-semibold text-gray-800">{value}km</span>
      </div>
      <input
        id="radius-slider"
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}km</span>
        <span>{max}km</span>
      </div>
    </div>
  );
}
