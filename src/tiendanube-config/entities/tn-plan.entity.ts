import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tn_plans')
export class TnPlan extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  slug!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  label!: string;

  @Column({
    name: 'cpt_pago_nube',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
  })
  cptPagoNube!: string;

  @Column({
    name: 'cpt_other_gateways',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
  })
  cptOtherGateways!: string;

  @Column({
    name: 'only_pago_nube',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  onlyPagoNube!: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isActive!: boolean;
}
