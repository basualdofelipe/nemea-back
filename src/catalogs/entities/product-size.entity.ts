import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('product_sizes')
export class ProductSize extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;
}
