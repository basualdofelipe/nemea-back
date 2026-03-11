import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExpenseCategory } from '../../catalogs/entities/expense-category.entity';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  amount!: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  concept!: string;

  @Column({ type: 'date', nullable: false })
  date!: string;

  @ManyToOne(() => ExpenseCategory, { eager: true, nullable: false })
  @JoinColumn({ name: 'category_id' })
  category!: ExpenseCategory;
}
