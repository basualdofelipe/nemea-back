import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProductType } from '../../catalogs/entities/product-type.entity';
import { ProductName } from '../../catalogs/entities/product-name.entity';
import { ProductFinish } from '../../catalogs/entities/product-finish.entity';
import { ProductColor } from '../../catalogs/entities/product-color.entity';
import { ProductSize } from '../../catalogs/entities/product-size.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ name: 'sku_code', type: 'varchar', length: 50, nullable: false })
  skuCode!: string;

  @ManyToOne(() => ProductType, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_type_id' })
  type!: ProductType;

  @ManyToOne(() => ProductName, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_name_id' })
  name!: ProductName;

  @ManyToOne(() => ProductFinish, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_finish_id' })
  finish!: ProductFinish;

  @ManyToOne(() => ProductColor, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_color_id' })
  color!: ProductColor;

  @ManyToOne(() => ProductSize, { eager: true, nullable: false })
  @JoinColumn({ name: 'product_size_id' })
  size!: ProductSize;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
