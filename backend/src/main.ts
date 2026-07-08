import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // フロントエンド(Next.js)は別オリジンで動くため、ブラウザからの直接fetchを許可する。
  app.enableCors();

  // /api/spots, /api/geocode のようにURL構造上の決め事をここに集約する。
  app.setGlobalPrefix('api');

  // whitelist: DTOに定義されていないクエリパラメータを自動的に除去する。
  // transform: クエリ文字列をDTOの@Type()に従って数値等へ変換してからハンドラに渡す。
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
