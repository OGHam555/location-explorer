import { Controller, Get, Query } from '@nestjs/common';
import { GeocodeQueryDto } from './dto/geocode-query.dto';
import { GeocodeService } from './geocode.service';

// グローバルプレフィックス 'api'（main.ts）と合わせて GET /api/geocode を提供する。
@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Get()
  async findAddress(
    @Query() query: GeocodeQueryDto,
  ): Promise<{ address: string | null }> {
    const address = await this.geocodeService.reverseGeocode(
      query.lat,
      query.lng,
    );
    return { address };
  }
}
