import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tn_payment_gateways')
export class TnPaymentGateway extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  slug!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  label!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isActive!: boolean;
}
