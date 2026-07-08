import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Spot } from './spot.entity';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';

// 自社DB（PostGIS）への半径検索を担当するモジュール。
// 外部API（Google）を扱うgeocodeモジュールとは意図的に分離し、
// キャッシュ戦略や変更の影響範囲を独立させる（技術仕様書の責務分離方針）。
@Module({
  imports: [TypeOrmModule.forFeature([Spot])],
  controllers: [SpotsController],
  providers: [SpotsService],
})
export class SpotsModule {}
