import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodeCache } from './geocode.cache';

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{ formatted_address: string }>;
}

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cache: GeocodeCache,
  ) {}

  // 座標→住所変換。
  // キャッシュを最初にチェックすることで、地図移動で同じ範囲に戻ってきた場合等に
  // Google APIへの再問い合わせ（課金・レート制限対象）を避ける。
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const cached = this.cache.get(lat, lng);
    if (cached.hit) {
      return cached.address;
    }

    const address = await this.fetchFromGoogle(lat, lng);
    this.cache.set(lat, lng, address);
    return address;
  }

  private async fetchFromGoogle(lat: number, lng: number): Promise<string | null> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('language', 'ja');
    url.searchParams.set('key', apiKey ?? '');

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      this.logger.error('Google Geocoding APIへの接続に失敗しました', error);
      throw new BadGatewayException('住所の取得に失敗しました');
    }

    if (!response.ok) {
      this.logger.error(`Google Geocoding APIがHTTP ${response.status} を返しました`);
      throw new BadGatewayException('住所の取得に失敗しました');
    }

    const data = (await response.json()) as GoogleGeocodeResponse;

    // ZERO_RESULTS は「海上・国境外など住所が存在しない地点」であり得るため、
    // エラーではなく「住所なし」として扱う（FE側で「-」等の表示に使う）。
    if (data.status === 'ZERO_RESULTS') {
      return null;
    }

    if (data.status !== 'OK') {
      this.logger.error(`Google Geocoding APIがエラーを返しました: ${data.status}`);
      throw new BadGatewayException('住所の取得に失敗しました');
    }

    return data.results[0]?.formatted_address ?? null;
  }
}
