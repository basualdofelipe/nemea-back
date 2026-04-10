import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
@Unique(['name'])
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ name: 'can_view_products', type: 'boolean', default: false })
  canViewProducts!: boolean;

  @Column({ name: 'can_edit_products', type: 'boolean', default: false })
  canEditProducts!: boolean;

  @Column({ name: 'can_view_supplies', type: 'boolean', default: false })
  canViewSupplies!: boolean;

  @Column({ name: 'can_edit_supplies', type: 'boolean', default: false })
  canEditSupplies!: boolean;

  @Column({ name: 'can_view_expenses', type: 'boolean', default: false })
  canViewExpenses!: boolean;

  @Column({ name: 'can_edit_expenses', type: 'boolean', default: false })
  canEditExpenses!: boolean;

  @Column({ name: 'can_use_calculator', type: 'boolean', default: false })
  canUseCalculator!: boolean;

  @Column({ name: 'can_manage_scenarios', type: 'boolean', default: false })
  canManageScenarios!: boolean;

  @Column({ name: 'can_view_dashboard', type: 'boolean', default: false })
  canViewDashboard!: boolean;

  @Column({ name: 'can_manage_config', type: 'boolean', default: false })
  canManageConfig!: boolean;

  @Column({ name: 'can_manage_users', type: 'boolean', default: false })
  canManageUsers!: boolean;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  // Non-persisted virtual property — populated by loadRelationCountAndMap in RolesService.findAll()
  userCount?: number;
}
