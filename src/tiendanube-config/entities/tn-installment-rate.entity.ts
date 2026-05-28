import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tn_installment_rates')
export class TnInstallmentRate extends BaseEntity {
  @Column({ type: 'integer', nullable: false })
  installments!: number;

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
