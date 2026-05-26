import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { ScenariosService } from '../scenarios/scenarios.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly scenariosService: ScenariosService,
  ) {}

  async findActiveByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    if (dto.roleId) {
      const roleExists = await this.roleRepository.findOne({
        where: { id: dto.roleId },
      });
      if (!roleExists) {
        throw new NotFoundException('Rol no encontrado');
      }
    }

    const user = this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      role: dto.roleId ? ({ id: dto.roleId } as Role) : undefined,
    });
    return this.usersRepository.save(user);
  }

  async updateGoogleProfile(
    id: string,
    data: { name: string | null; pictureUrl: string | null; googleId: string },
  ): Promise<void> {
    await this.usersRepository.update(id, {
      name: data.name,
      pictureUrl: data.pictureUrl,
      googleId: data.googleId,
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    callerId: string,
  ): Promise<User> {
    const victim = await this.usersRepository.findOne({ where: { id } });
    if (!victim) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Defensive: User.role is technically nullable at the DB layer (the
    // @ManyToOne decorator does not enforce non-null in TypeORM). Null-coalesce
    // the id and permission lookups so a user without a role does not crash
    // with TypeError -- callers get well-formed 400/404 responses instead.
    const victimRoleId = victim.role?.id ?? null;

    // Guard 1: self-role-edit
    if (
      id === callerId &&
      dto.roleId !== undefined &&
      dto.roleId !== victimRoleId
    ) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }

    // Guard 2: self-deactivate
    if (id === callerId && dto.isActive === false) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    // Resolve new role if changed
    let newRole: Role | null = victim.role ?? null;
    if (dto.roleId !== undefined && dto.roleId !== victimRoleId) {
      const found = await this.roleRepository.findOne({
        where: { id: dto.roleId },
      });
      if (!found) {
        throw new NotFoundException('Rol no encontrado');
      }
      newRole = found;
    }

    // Guard 3: last-active-admin (computed after candidate write)
    const willBeActive = dto.isActive ?? victim.isActive;
    const willBeAdmin = newRole?.canManageUsers ?? false;
    const wasAdminActive =
      victim.isActive && (victim.role?.canManageUsers ?? false);
    const willNoLongerBeAdminActive =
      wasAdminActive && !(willBeActive && willBeAdmin);
    if (willNoLongerBeAdminActive) {
      const otherActiveAdmins = await this.usersRepository
        .createQueryBuilder('u')
        .innerJoin('u.role', 'r')
        .where('u.isActive = :active', { active: true })
        .andWhere('r.canManageUsers = :flag', { flag: true })
        .andWhere('u.id != :id', { id })
        .getCount();
      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'No se puede dejar el sistema sin administradores activos',
        );
      }
    }

    // Apply changes field-by-field (defense-in-depth: no repo.merge)
    if (dto.name !== undefined) {
      victim.name = dto.name;
    }
    // Only mutate role when a new one was resolved; never assign null over
    // an existing role (the User.role column is required at the type level
    // even though the DB column is nullable -- preserve current behavior).
    if (newRole) {
      victim.role = newRole;
    }
    if (dto.isActive !== undefined) {
      victim.isActive = dto.isActive;
    }

    return this.usersRepository.save(victim);
  }

  async remove(id: string, callerId: string): Promise<void> {
    // Guard 1: self-delete (fast-fail before any DB I/O)
    if (id === callerId) {
      throw new BadRequestException('No puedes borrarte a vos mismo');
    }

    const victim = await this.usersRepository.findOne({ where: { id } });
    if (!victim) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Guard 2: last-active-admin (null-safe on victim.role)
    if (victim.isActive && (victim.role?.canManageUsers ?? false)) {
      const otherActiveAdmins = await this.usersRepository
        .createQueryBuilder('u')
        .innerJoin('u.role', 'r')
        .where('u.isActive = :active', { active: true })
        .andWhere('r.canManageUsers = :flag', { flag: true })
        .andWhere('u.id != :id', { id })
        .getCount();
      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'No se puede dejar el sistema sin administradores activos',
        );
      }
    }

    // Atomic transfer + delete inside a QueryRunner transaction.
    // Order matters: transferOwnership BEFORE manager.delete so the
    // ON DELETE CASCADE never fires against the victim's scenarios.
    const queryRunner =
      this.usersRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Defensive: victim.name can be '' or whitespace (frontend may submit
      // empty string). ?? only fires on null/undefined, so trim first and fall
      // back to 'usuario borrado' for any falsy/whitespace value.
      const trimmedName = victim.name?.trim();
      const baseLabel = trimmedName ? trimmedName : 'usuario borrado';
      // WR-01: include a short slice of the victim's UUID in the suffix so
      // bulk-renamed scenarios stay unique against the caller's existing
      // scenarios (the (user_id, name) constraint is enforced in code only,
      // and two victims with the same name would collide otherwise).
      const shortId = id.slice(0, 8);
      const suffix = ` - ${baseLabel} #${shortId}`;
      await this.scenariosService.transferOwnership(
        id,
        callerId,
        suffix,
        queryRunner,
      );
      await queryRunner.manager.delete(User, id);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
