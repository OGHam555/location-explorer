// マーカー・リストの色分け用。
// シードデータには「観光名所」「交通機関」「体育施設」「公園」「博物館」「寺院」
// 「山岳」「歴史的建造物」「水族館」「神社」「科学施設」「美術館」「自然景観」
// 「テーマパーク」の14カテゴリが存在する。14色すべてを個別の色にすると
// 地図上で判別しづらくなるため、意味の近いカテゴリを6グループにまとめて配色する
// （リストの見出し自体は元のカテゴリ名のまま表示し、色だけをグループで揃える）。
interface CategoryGroup {
  label: string;
  color: string;
  categories: string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  { label: '観光名所', color: '#dc2626', categories: ['観光名所'] },
  { label: '交通機関', color: '#2563eb', categories: ['交通機関'] },
  { label: '自然', color: '#16a34a', categories: ['公園', '山岳', '自然景観'] },
  { label: '文化・歴史', color: '#a16207', categories: ['寺院', '神社', '歴史的建造物'] },
  { label: '学び・展示', color: '#7c3aed', categories: ['博物館', '美術館', '科学施設'] },
  { label: '娯楽・レジャー', color: '#ea580c', categories: ['テーマパーク', '体育施設', '水族館'] },
];

// シードにない未知のカテゴリが来た場合のフォールバック色。
const FALLBACK_COLOR = '#6b7280';

const CATEGORY_TO_COLOR = new Map<string, string>(
  CATEGORY_GROUPS.flatMap((group) => group.categories.map((category) => [category, group.color] as const)),
);

export function getCategoryColor(category: string): string {
  return CATEGORY_TO_COLOR.get(category) ?? FALLBACK_COLOR;
}
