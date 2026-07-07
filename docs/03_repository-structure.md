■リポジトリ構造定義書


1. 全体構成（モノレポ）

フロントエンド・バックエンド・DB設定を1つのリポジトリにまとめる。docker-compose up 一括起動の要件に合わせ、ルートにdocker-compose.ymlを配置する。
```
location-explorer/
├── docker-compose.yml          # DB / API / FE を一括起動
├── .env.example                # 環境変数のテンプレート（APIキー等）
├── .gitignore
├── README.md                   # 環境構築・実行手順・技術的判断
│
├── frontend/                   # Next.js (App Router)
├── backend/                    # NestJS
└── db/                         # DB初期化スクリプト・シードデータ

```

---

2. フロントエンド（frontend/）

Next.js (App Router) + TypeScript + Tailwind CSS。
```
frontend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
│
└── src/
    ├── app/
    │   ├── layout.tsx          # 全体レイアウト
    │   └── page.tsx            # メインページ（地図＋リスト）
    │
    ├── components/             # UIコンポーネント
    │   ├── Map.tsx             # 地図表示・マーカー描画
    │   ├── SpotList.tsx        # スポット一覧（リスト）
    │   ├── RadiusSlider.tsx    # 半径変更スライダー
    │   ├── AddressDisplay.tsx  # 中心地点の住所表示
    │   └── Spinner.tsx         # ローディング表示
    │
    ├── hooks/                  # カスタムフック（状態・ロジック）
    │   ├── useSpots.ts         # スポット取得ロジック
    │   └── useGeocode.ts       # 住所取得（デバウンス含む）
    │
    ├── lib/                    # API通信・ユーティリティ
    │   └── api.ts              # バックエンドへのリクエスト関数
    │
    └── types/                  # 型定義
        └── spot.ts             # Spot型など

```

各ディレクトリの役割

- app/：ページとレイアウト。App Routerのルーティング単位。
- components/：見た目の部品。機能ごとに分割し再利用性を高める。
- hooks/：状態管理とロジックを画面から分離。デバウンスやAPI呼び出しの制御をここに集約。
- lib/：バックエンドとの通信処理をまとめ、コンポーネントから通信の詳細を隠蔽。
- types/：フロント・バック間で共有するデータ型を定義。
---

3. バックエンド（backend/）

NestJS + TypeORM。Controller / Service / Repository の責務分離を意識する。
```
backend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── nest-cli.json
│
└── src/
    ├── main.ts                 # アプリのエントリポイント
    ├── app.module.ts           # ルートモジュール
    │
    ├── spots/                  # スポット検索機能
    │   ├── spots.module.ts
    │   ├── spots.controller.ts # GET /api/spots（ルーティング）
    │   ├── spots.service.ts    # 半径検索のビジネスロジック
    │   └── spot.entity.ts      # spotsテーブルのエンティティ
    │
    ├── geocode/                # 逆ジオコーディング機能
    │   ├── geocode.module.ts
    │   ├── geocode.controller.ts # GET /api/geocode
    │   ├── geocode.service.ts    # Google API呼び出し＋キャッシュ
    │   └── geocode.cache.ts      # キャッシュ処理
    │
    └── config/                 # 設定
        └── database.config.ts  # DB接続設定

```

各モジュールの役割

- spots/：自社DB（PostGIS）への半径検索を担当。Controllerがリクエストを受け、Serviceが検索ロジック、EntityがテーブルとのマッピングをTypeORMで行う。
- geocode/：外部API（Google）への逆ジオコーディングを担当。キャッシュを挟んでAPI呼び出しを抑制する。
- config/：DB接続などの設定を集約。
- 責務分離の意図：自社DB問い合わせ（spots）と外部API呼び出し（geocode）をモジュールで分けることで、キャッシュ戦略や変更の影響範囲を独立させる。
---

4. データベース（db/）

PostgreSQL + PostGIS。初期化スクリプトとシードデータを配置。
```
db/
├── init/                       # 初回起動時に自動実行される
│   ├── 01_init_extension.sql   # PostGIS拡張の有効化
│   ├── 02_create_table.sql     # spotsテーブル作成＋GISTインデックス
│   └── 03_import_seed.sql      # CSVインポート＋location生成
│
└── seed/
    └── spots.csv               # 提供されたシードデータ

```

実行順序の意図

ファイル名に連番を付け、docker-entrypoint-initdb.d での実行順を制御する。
```
01 PostGIS拡張を有効化
  ↓
02 テーブル作成・GISTインデックス付与
  ↓
03 CSVをインポートし、lat/longからlocationを生成

```
この順序でないと、拡張やテーブルが未定義の状態でインポートが走り失敗するため、連番で順序を保証する。
---

5. ルート直下のファイル

ファイル
役割
docker-compose.yml
DB / API / FE の3コンテナを定義・一括起動
.env.example
必要な環境変数のテンプレート（APIキー等）。実際の値は含めない
.gitignore
node_modules、.env などを除外
README.md
環境構築・実行手順・使用ライブラリと選定理由・工夫した点・今後の改善点

---

6. この構成の設計意図（面接用サマリ）

- モノレポ：docker-compose up 一括起動の要件に合わせ、FE/BE/DBを1リポジトリに集約。
- 責務分離：バックエンドを「自社DB検索（spots）」と「外部API（geocode）」でモジュール分割し、キャッシュや変更の影響を独立させた。
- ロジックの分離（FE）：hooksにAPI呼び出し・デバウンスを集約し、コンポーネントは表示に専念させた。
- DB初期化の順序保証：連番SQLで拡張有効化→テーブル作成→インポートの順を担保した。
