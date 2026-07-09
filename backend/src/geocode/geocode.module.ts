import { Module } from '@nestjs/common';
import { GeocodeCache } from './geocode.cache';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';

// 外部API（Google Geocoding API）を扱うモジュール。
// 自社DB（PostGIS）への半径検索を担当するspotsモジュールとは意図的に分離し、
// キャッシュ戦略・APIキー・レート制御の影響範囲を独立させる（技術仕様書の責務分離方針）。
@Module({
  controllers: [GeocodeController],
  providers: [GeocodeService, GeocodeCache],
})
export class GeocodeModule {}
