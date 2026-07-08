import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// db/init/02_create_table.sql の spots テーブル定義に対応する。
// テーブルの権威はSQL側にあるため、このEntityはマッピング専用として扱う
// （synchronize:false と合わせて、TypeORMからスキーマを変更しない）。
@Entity('spots')
export class Spot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('double precision')
  lat: number;

  @Column('double precision')
  long: number;

  @Column({ nullable: true })
  address: string;

  // 半径検索（ST_DWithin）専用のPostGIS列。
  // FEに返すデータではないため select: false で通常のクエリ結果から除外する。
  // 値はCSVインポート時のSQLで生成される派生列であり、TypeORM経由での
  // 書き込み経路は持たせない。
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    select: false,
    insert: false,
    update: false,
    nullable: true,
  })
  location: string;
}
