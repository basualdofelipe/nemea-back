import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_price_history')
export class ProductPriceHistory extends BaseEntity {
  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  price!: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    default: 'ARS',
  })
  currency!: string;
}
