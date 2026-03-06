import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('product_colors')
export class ProductColor extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ name: 'sku_code', type: 'smallint', unique: true })
  skuCode!: number;
}
