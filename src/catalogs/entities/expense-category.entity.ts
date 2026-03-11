import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('expense_categories')
export class ExpenseCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;
}
