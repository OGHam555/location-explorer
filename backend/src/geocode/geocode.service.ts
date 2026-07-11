import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodeCache } from './geocode.cache';

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    address_components: GoogleAddressComponent[];
  }>;
}

// 本プロジェクトのスポットは全国データのみ（海外スポットは存在しない）ため、
// 地図を海外までパンして逆ジオコーディングした場合は詳細な住所を出さず「日本国外」とだけ表示する。
const OUTSIDE_JAPAN_LABEL = '日本国外';

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

    const result = data.results[0];
    if (!result) {
      return null;
    }

    const countryComponent = result.address_components.find((component) =>
      component.types.includes('country'),
    );
    if (countryComponent?.short_name !== 'JP') {
      return OUTSIDE_JAPAN_LABEL;
    }

    return this.formatJapaneseAddress(result.formatted_address);
  }

  // Google側の formatted_address は「日本、〒157-0066 東京都世田谷区成城４丁目２７−１４」のように
  // 国名・郵便番号を含むが、スポットは全国内データのみで国名表示は冗長、郵便番号もUI上不要なため取り除く。
  private formatJapaneseAddress(formattedAddress: string): string {
    return formattedAddress
      .replace(/^日本、?\s*/, '')
      .replace(/〒\d{3}-\d{4}\s*/, '')
      .trim();
  }
}
