# CLAUDE.md

このファイルは、本プロジェクトで作業する際のClaude Code向けガイドです。

## プロジェクト概要

地図上で周辺のスポットを検索・探索できるWebアプリケーション。
全国の観光スポット約200件（CSV）を地図表示し、半径検索・住所表示を行う。

本プロジェクトは技術課題として開発する。評価観点は「フルスタック開発能力」と「データ設計への配慮」。

環境構築手順・使用ライブラリの選定理由・実装時の技術的判断・今後の改善点は `README.md`（リポジトリルート）にまとめている。要件定義・アーキテクチャ・リポジトリ構造の詳細は `docs/01_PRD.md` / `docs/02_architecture.md` / `docs/03_repository-structure.md` を参照。

## 技術スタック（変更禁止・課題指定）

- フロントエンド: Next.js (App Router) + TypeScript + Tailwind CSS
- バックエンド: NestJS + TypeORM
- データベース: PostgreSQL + PostGIS
- 地図・逆ジオコーディング: Google Maps API
- インフラ: Docker / Docker Compose

## ディレクトリ構成

```
location-explorer/
├── docker-compose.yml   # DB / API / FE を一括起動
├── .env.example         # 環境変数テンプレート（APIキー等）
├── README.md             # 環境構築・実行手順・技術的判断
├── docs/                 # 要件定義・アーキテクチャ・リポジトリ構造・本ファイル
├── frontend/             # Next.js
├── backend/              # NestJS（spots / geocode モジュール）
└── db/                   # 初期化SQL・シードCSV
```

## 設計方針

### API設計（責務分離）
- `GET /api/spots?lat={}&lng={}&radius={}` — 半径内スポットを配列で返す（PostGISで絞り込み）
- `GET /api/geocode?lat={}&lng={}` — 座標を住所に変換（Google API＋キャッシュ）
- スポット検索（自社DB）と逆ジオコーディング（外部API）はモジュールを分ける

### DB設計
- spotsテーブルに id（SERIAL主キー）を付与（CSVにはIDがないため）
- lat / long は数値でそのまま保持（FE返却・マーカー用）
- location は GEOGRAPHY(POINT, 4326) 型（PostGIS検索用、lat/longから生成）
- location に GISTインデックスを張る
- ST_MakePoint(long, lat) の順序に注意（経度・緯度の順）
- 半径検索は ST_DWithin を使い、DB側で絞り込む（FEで全件距離計算しない）

### データインポート
- db/init/ 配下に連番SQLを配置し、docker-entrypoint-initdb.d で自動実行
  - 01: PostGIS拡張の有効化
  - 02: テーブル作成＋GISTインデックス
  - 03: CSVインポート＋location生成
- docker-compose up 一発で初期状態から動作可能にする

### パフォーマンス・最適化
- 逆ジオコーディングはBE経由で実行（APIキーをフロントに露出させない）
- 逆ジオコーディング結果はBE側でキャッシュ（緯度経度を小数点3桁≈100m格子に丸めてキー化、TTLなし）
- FEは地図移動が止まってからAPIを呼ぶ（デバウンス。geocode: 500ms / spots: 400ms）
- FE側で「直前にAPIを呼んだ地点から実距離100m未満の移動」なら、そもそもAPIを呼ばず前回結果を再利用する（`frontend/src/lib/geo.ts` の `distanceMeters` / `MOVE_THRESHOLD_METERS`）。閾値100mはBE側キャッシュの格子と揃えている
- スポット検索は中心・半径が変化したときのみ発火（半径が変わった場合は移動距離に関わらず必ず再検索）
- 待機中に再移動があれば AbortController で進行中のリクエストを中断する

### 初期値
- 初期中心点: 東京駅（lat 35.681, lng 139.767）
- 初期半径: 50km（全国分散データのため広域）
- 半径可変範囲: 10km〜200km

### UI/UX
- マーカーはカテゴリごとに色分け
- 地図とリストは同一のスポット配列を共有して連動
- リストのカテゴリ内は中心点からの距離が近い順にソートし、各スポットに距離（km）を表示する（`frontend/src/lib/geo.ts` の `distanceMeters` を再利用）
- リスト先頭に「「半径N km以内」に存在するスポット」と表示し、現在の検索条件（半径）を明示する
- 半径内が0件のとき「付近に該当するスポットが存在しません」と表示
- 地図移動中・住所取得中はスピナー表示
- 住所表示は Google の formatted_address から国名・郵便番号を除去した文字列のみ表示する（例:「東京都世田谷区成城４丁目２７−１４」）。国外（address_components の country が JP 以外）の場合は詳細住所を出さず「日本国外」とだけ表示する（提供スポットデータが国内のみのため）
- 地図中心地点（住所表示中の座標）には、スポットマーカーと区別できる専用マーカーを表示し、中心座標が変わるたびに追従させる

## セキュリティ

- APIキーはリポジトリに含めない（.env管理、.env.example のみコミット）

## 作業上のルール

- 実装の各ステップで「なぜこの実装・構成にしたか」を説明すること
- 設計判断（PostGIS採用、API分割、キャッシュ戦略など）は上記方針に従うこと
- 勝手に技術スタックを変更しないこと
