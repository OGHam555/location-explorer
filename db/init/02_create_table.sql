-- spots テーブルを作成する。
--
-- id       : CSVにIDが含まれていないため、SERIALで自動採番する。
-- lat/long : フロントへの返却・マーカー描画用にそのまま数値で保持する
--            （PostGISのGEOGRAPHY型から都度緯度経度を取り出すよりシンプルで安価なため）。
-- location : 半径検索（ST_DWithin）専用。lat/longから生成する派生カラム。
--            用途が異なるため lat/long と location を両方持たせる二重保持とする。
CREATE TABLE IF NOT EXISTS spots (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    lat      DOUBLE PRECISION NOT NULL,
    long     DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    address  VARCHAR(255)
);

-- 半径検索（ST_DWithin）を高速化するための地理空間インデックス。
-- GISTインデックスがないと、検索のたびに全行を距離計算する全表スキャンになり、
-- データ量が増えたときに性能が劣化する。
CREATE INDEX IF NOT EXISTS idx_spots_location ON spots USING GIST (location);
