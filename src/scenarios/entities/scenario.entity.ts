import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TnPlan } from '../../tiendanube-config/entities/tn-plan.entity';
import { ScenarioOverride } from './scenario-override.entity';

@Entity('scenarios')
export class Scenario extends BaseEntity {
  @Column({ type: 'varchar', length: 200, nullable: false })
  name!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({
    name: 'gateway_slug',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  gatewaySlug!: string | null;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod!: string | null;

  @Column({ name: 'withdrawal_days', type: 'integer', nullable: true })
  withdrawalDays!: number | null;

  @Column({ type: 'integer', nullable: true })
  installments!: number | null;

  @ManyToOne(() => TnPlan, { nullable: true, eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan!: TnPlan | null;

  @OneToMany(() => ScenarioOverride, (o) => o.scenario, { cascade: true })
  overrides!: ScenarioOverride[];
}
