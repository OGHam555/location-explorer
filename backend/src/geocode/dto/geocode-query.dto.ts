import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

// GET /api/geocode?lat={}&lng={} のクエリパラメータ。
// spots-query.dto.ts と同様、クエリ文字列は常にstringで届くため
// @Type(() => Number) で数値へ変換してから検証する。
export class GeocodeQueryDto {
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;
}
