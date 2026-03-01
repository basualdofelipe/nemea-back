import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('supply_types')
export class SupplyType extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;
}
