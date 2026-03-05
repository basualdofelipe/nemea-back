import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Supply } from './supply.entity';

@Entity('supply_price_history')
export class SupplyPriceHistory extends BaseEntity {
  @ManyToOne(() => Supply, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supply_id' })
  supply!: Supply;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  price!: string;
}
