-- シードCSVをインポートし、PostGIS検索用の location カラムを生成する。
--
-- COPY は id と location を除いた5カラムのみを対象にする（id は自動採番、
-- location はこの後の UPDATE で lat/long から生成するため）。
-- CSVはUTF-8(BOM付き)だが、HEADER true は1行目の中身を検証せず単純に読み飛ばす
-- だけなので、BOMが含まれていてもデータ行には影響しない。
--
-- ファイルパス /seed/... は docker-compose.yml で ./db/seed を
-- コンテナ内の /seed にマウントしている前提のパス。
COPY spots (name, category, lat, long, address)
FROM '/seed/landit_coding_test_seed.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- ST_MakePoint(long, lat) の順序に注意（第1引数が経度、第2引数が緯度）。
-- 取り違えると座標が地球の裏側にずれるため、SRID 4326 を明示した上で
-- geography型にキャストする。
UPDATE spots
SET location = ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography
WHERE location IS NULL;
