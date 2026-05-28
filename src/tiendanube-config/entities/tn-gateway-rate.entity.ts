import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TnPaymentGateway } from './tn-payment-gateway.entity';

@Entity('tn_gateway_rates')
@Index('IDX_tn_gateway_rates_lookup', [
  'gateway',
  'paymentMethod',
  'withdrawalDays',
  'createdAt',
])
export class TnGatewayRate extends BaseEntity {
  @ManyToOne(() => TnPaymentGateway, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gateway_id' })
  gateway!: TnPaymentGateway;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  paymentMethod!: string;

  @Column({
    name: 'withdrawal_days',
    type: 'integer',
    nullable: false,
  })
  withdrawalDays!: number;

  @Column({
    name: 'rate_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
  })
  ratePercent!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isActive!: boolean;
}
