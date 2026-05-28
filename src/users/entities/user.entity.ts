import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ name: 'picture_url', type: 'varchar', length: 500, nullable: true })
  pictureUrl!: string | null;

  @Column({ name: 'google_id', type: 'varchar', length: 50, nullable: true })
  googleId!: string | null;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
