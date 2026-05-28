import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tn_tax_config')
export class TnTaxConfig extends BaseEntity {
  @Column({
    name: 'iva_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
  })
  ivaRate!: string;

  @Column({
    name: 'iibb_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
  })
  iibbRate!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isActive!: boolean;
}
