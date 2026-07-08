import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// DBスキーマ（拡張有効化・テーブル作成・GISTインデックス・CSVインポート）は
// db/init/*.sql が権威を持つ。TypeORM側でスキーマを作り直すと、そこで張った
// GISTインデックスやgeography型の生成ロジックと二重管理になり食い違う恐れが
// あるため、synchronize は必ず false にする。
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('POSTGRES_USER'),
  password: configService.get<string>('POSTGRES_PASSWORD'),
  database: configService.get<string>('POSTGRES_DB'),
  autoLoadEntities: true,
  synchronize: false,
});
