import { Controller, Get, Query } from '@nestjs/common';
import { SpotsQueryDto } from './dto/spots-query.dto';
import { Spot } from './spot.entity';
import { SpotsService } from './spots.service';

// グローバルプレフィックス 'api'（main.ts）と合わせて GET /api/spots を提供する。
@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get()
  findAll(@Query() query: SpotsQueryDto): Promise<Spot[]> {
    return this.spotsService.findWithinRadius(
      query.lat,
      query.lng,
      query.radius,
    );
  }
}
