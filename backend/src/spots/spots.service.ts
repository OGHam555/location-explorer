import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spot } from './spot.entity';

@Injectable()
export class SpotsService {
  constructor(
    @InjectRepository(Spot)
    private readonly spotRepository: Repository<Spot>,
  ) {}

  // 半径検索はアプリ側で全件距離計算せず、PostGISのST_DWithinでDB側に絞り込みを
  // 委譲する（location列のGISTインデックスが効くため、データ量が増えても劣化しにくい）。
  async findWithinRadius(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<Spot[]> {
    // location は GEOGRAPHY 型のため、ST_DWithin の半径引数はメートル単位で解釈される。
    const radiusMeters = radiusKm * 1000;

    return this.spotRepository
      .createQueryBuilder('spot')
      .where(
        // ST_MakePoint(経度, 緯度) の順序。DB初期化SQL(03_import_seed.sql)と揃える。
        'ST_DWithin(spot.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)',
        { lat, lng, radiusMeters },
      )
      .getMany();
  }
}
