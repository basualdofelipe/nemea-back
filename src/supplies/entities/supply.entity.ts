import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SupplyType } from '../../catalogs/entities/supply-type.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

export enum UnitType {
  M2 = 'm2',
  UNIDAD = 'unidad',
  METRO = 'metro',
  KG = 'kg',
}

@Entity('supplies')
export class Supply extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @ManyToOne(() => SupplyType, { eager: true, nullable: false })
  @JoinColumn({ name: 'type_id' })
  type!: SupplyType;

  @ManyToOne(() => Supplier, { eager: true, nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({
    name: 'unit_type',
    type: 'enum',
    enum: UnitType,
    default: UnitType.UNIDAD,
  })
  unitType!: UnitType;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
