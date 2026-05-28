import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Scenario } from './scenario.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('scenario_overrides')
@Unique(['scenario', 'product'])
export class ScenarioOverride extends BaseEntity {
  @ManyToOne(() => Scenario, (s) => s.overrides, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scenario_id' })
  scenario!: Scenario;

  @ManyToOne(() => Product, { nullable: false, eager: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({
    name: 'override_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  overridePrice!: string;
}
