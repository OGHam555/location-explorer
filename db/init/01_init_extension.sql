-- PostGIS拡張を有効化する。
-- spotsテーブルのGEOGRAPHY型・ST_DWithin等の地理空間関数はこの拡張が前提となるため、
-- テーブル作成より前に必ず実行する必要がある（そのため連番の先頭 01 とする）。
CREATE EXTENSION IF NOT EXISTS postgis;
