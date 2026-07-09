// backend/src/spots/spot.entity.ts のレスポンス形状に対応する。
// location（PostGIS用の内部列）は select:false でAPIレスポンスに含まれないため、
// フロント側の型にも含めない。
export interface Spot {
  id: number;
  name: string;
  category: string;
  lat: number;
  long: number;
  address: string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}
