import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsPositive } from 'class-validator';

// GET /api/spots?lat={}&lng={}&radius={} のクエリパラメータ。
// クエリ文字列は常にstringで届くため @Type(() => Number) で数値へ変換してから検証する。
// radius の単位は km（PRDの初期値50km・可変範囲10〜200kmに合わせる）。
export class SpotsQueryDto {
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;

  @Type(() => Number)
  @IsPositive()
  radius: number;
}
