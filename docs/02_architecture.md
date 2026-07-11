
■技術仕様書

1. テクノロジースタック

フロントエンド

- Next.js (App Router) — Reactベースのフルスタックフレームワーク
- TypeScript — 型安全な開発
- Tailwind CSS — ユーティリティファーストのCSSフレームワーク
- Google Maps JavaScript API — 地図表示・マーカー描画

バックエンド

- NestJS — TypeScriptベースのサーバーサイドフレームワーク（レイヤー構造・DIを備える）
- TypeORM — TypeScript向けORM
- Google Maps Geocoding API — 逆ジオコーディング（座標→住所変換）

データベース

- PostgreSQL — リレーショナルデータベース
- PostGIS — 地理空間データを扱うPostgreSQL拡張機能

インフラ

- Docker / Docker Compose — コンテナによる環境構築・一括起動

技術選定の理由

- 地図・逆ジオコーディングをGoogle Mapsに統一：地図表示と住所変換を同一APIで完結させることで、ライブラリ混在を避け保守性を高め、呼び出し最適化を一元管理できる。
- PostGISの採用：半径検索をアプリ側の全件距離計算ではなくDB側で実行することで、データ量増加時も性能が劣化しにくい設計とするため。課題目的である「データ設計への配慮」に直結する。
- NestJSのレイヤー構造：Controller / Service / Repository の責務分離により、スポット検索（自社DB）と逆ジオコーディング（外部API）を疎結合に保つ。
---

2. 開発ツールと手法


開発ツール

- バージョン管理：Git / GitHub
- コンテナ管理：Docker Compose（DB / API / FE の3コンテナ構成）
- 環境変数管理：.env（APIキー等の機密情報）。リポジトリには .env.example のみ含める。

アーキテクチャ方針

- 責務分離したAPI設計：スポット検索と逆ジオコーディングを別エンドポイントに分割
	- GET /api/spots?lat={}&lng={}&radius={} — 半径内スポットを配列で返却
	- GET /api/geocode?lat={}&lng={} — 座標を住所へ変換して返却
- 単一データソースによるFE連動：BEから返却したスポット配列を、地図マーカーとリスト表示が共有し連動させる。

起動フロー


```
docker-compose up
  ↓
PostgreSQL（PostGIS有効化）起動
  ↓
初期化スクリプトでCSVを自動インポート＋location生成
  ↓
NestJS（API）・Next.js（FE）起動
  ↓
アプリ動作可能
```

データインポート方式

- PostgreSQLの初期化フォルダ（/docker-entrypoint-initdb.d）を利用
- DB初回起動時に、拡張有効化・テーブル作成・CSV取り込み・location生成を自動実行
- docker-compose up 一発で初期状態から動作可能とする
---

3. 技術的制約と要件


制約（課題指定）

項目
指定
フロント
Next.js (App Router) + Tailwind CSS
バックエンド
NestJS + TypeORM
DB
PostgreSQL（PostGIS推奨）
言語
TypeScript
インフラ
Docker / Docker Compose
起動
docker-compose up 一括起動

データ設計


```
spots テーブル
- id       SERIAL PRIMARY KEY        主キー（CSVにないため自動採番で付与）
- name     VARCHAR(255) NOT NULL     スポット名
- category VARCHAR(100) NOT NULL     カテゴリ
- lat      DOUBLE PRECISION NOT NULL 緯度（FE返却・マーカー用）
- long     DOUBLE PRECISION NOT NULL 経度（FE返却・マーカー用）
- location GEOGRAPHY(POINT, 4326)    PostGIS検索用（lat/longから生成）
- address  VARCHAR(255)              住所
```
- lat/long と location の二重保持：lat/longはFEへそのまま返す用途、locationはPostGIS検索用。役割が異なるため両持ちとする。
- GISTインデックス：location にGISTインデックスを張り、半径検索を高速化。
- 座標順序の注意：ST_MakePoint(long, lat) は経度・緯度の順。取り違えに注意。

セキュリティ要件

- APIキーはリポジトリに含めない（.env管理、.env.exampleを提供）
- 逆ジオコーディングはBE経由で実行し、APIキーのフロント露出を防ぐ

エラー・エッジケース要件

- 半径内にスポットが0件の場合、「付近に該当するスポットが存在しません」と表示
- 地図移動中・API応答待ちはスピナーでローディング表示
- リスト先頭に「「半径N km以内」に存在するスポット」と表示し、検索条件（半径）を常に明示（ローディング・エラー・0件時も含む全状態で表示し、リストの表示根拠をユーザーが判断できるようにする）
---

4. パフォーマンス要件


半径検索の最適化

- DB側絞り込み：PostGISの ST_DWithin を用い、半径内スポットのみをDBで抽出してから返却。FE側で全件距離計算を行わない。
- 地理空間インデックス：GISTインデックスにより検索コストを抑制。

逆ジオコーディングAPI呼び出しの抑制

- デバウンス：地図移動が止まってから一定時間後にAPIを呼び、移動中の連続発火を防ぐ。
- 距離ベースの間引き（FE側）：直前にAPIを呼んだ中心座標から実距離（Haversine公式で算出、`frontend/src/lib/geo.ts`）で100m未満の移動では、そもそもAPIを呼ばず直前の住所を再利用する。緯度経度の単純な差ではなく実距離で判定するのは、経度1度あたりの距離が緯度によって変わり、度差だけでは全国一律の基準にならないため。
  - 閾値100mはBE側キャッシュの座標丸め粒度（後述、小数点3桁≈100m格子）と揃えている。同じ格子内の移動はどうせ同じキャッシュ結果が返るだけなので、FE→BE間のリクエスト自体を発生させない。
- キャッシュ機構（BE側）：一度取得した座標→住所の結果をキャッシュし、同一・近接座標の再問い合わせを削減。
- BE経由集約：逆ジオコーディングをBEに集約することで、キャッシュ・レート制御を一元管理。

住所表示フォーマットの整形（BE側）

- Google Geocoding APIの formatted_address（例：「日本、〒157-0066 東京都世田谷区成城４丁目２７−１４」）から国名・郵便番号を除去し、都道府県以下のみを返却する。
- address_components の country（short_name）が JP でない場合は詳細住所を返さず「日本国外」と返却する。提供スポットデータが国内のみのため、国外の住所整形ルールを別途持つ必要がないという判断。
- 整形はFEに表示ロジックを持たせず、BE（GeocodeService）に集約する。FE（AddressDisplay）はBEが返した文字列をそのまま表示するだけの責務に留める。

スポット検索呼び出しの抑制

- 中心座標・半径が変化したときのみ /api/spots を呼び出し、住所表示（高頻度）とは呼び出しタイミングを分離。
- 距離ベースの間引き（FE側）：半径が変化していない場合に限り、直前に検索した中心座標から実距離で100m未満の移動では再検索しない（逆ジオコーディングと同じ`distanceMeters`ユーティリティ・同じ閾値を使用）。半径が変化した場合は抽出範囲自体が変わるため、移動距離に関わらず必ず再検索する。

呼び出し頻度の設計意図

API
呼び出し契機
頻度
抑制策
/api/geocode
地図中心の移動
高
デバウンス＋キャッシュ
/api/spots
中心・半径の変更
中
変更時のみ発火
