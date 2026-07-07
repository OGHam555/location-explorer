# CLAUDE.md

このファイルは、本プロジェクトで作業する際のClaude Code向けガイドです。

## プロジェクト概要

地図上で周辺のスポットを検索・探索できるWebアプリケーション。
全国の観光スポット約500件（CSV）を地図表示し、半径検索・住所表示を行う。

本プロジェクトは技術課題として開発する。評価観点は「フルスタック開発能力」と「データ設計への配慮」。

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
├── frontend/            # Next.js
├── backend/             # NestJS（spots / geocode モジュール）
└── db/                  # 初期化SQL・シードCSV
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
- 逆ジオコーディング結果はBE側でキャッシュし、呼び出しを抑制
- FEは地図移動が止まってからAPIを呼ぶ（デバウンス）
- スポット検索は中心・半径が変化したときのみ発火

### 初期値
- 初期中心点: 東京駅（lat 35.681, lng 139.767）
- 初期半径: 50km（全国分散データのため広域）
- 半径可変範囲: 10km〜200km

### UI/UX
- マーカーはカテゴリごとに色分け
- 地図とリストは同一のスポット配列を共有して連動
- 半径内が0件のとき「付近に該当するスポットが存在しません」と表示
- 地図移動中・住所取得中はスピナー表示

## セキュリティ

- APIキーはリポジトリに含めない（.env管理、.env.example のみコミット）

## 作業上のルール

- 実装の各ステップで「なぜこの実装・構成にしたか」を説明すること
- 設計判断（PostGIS採用、API分割、キャッシュ戦略など）は上記方針に従うこと
- 勝手に技術スタックを変更しないこと
