import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('supplies_per_product_history')
export class SuppliesPerProductHistory extends BaseEntity {
  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Supply, { nullable: false, eager: true })
  @JoinColumn({ name: 'supply_id' })
  supply!: Supply;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  quantity!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
