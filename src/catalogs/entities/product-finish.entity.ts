import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('product_finishes')
export class ProductFinish extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;
}
