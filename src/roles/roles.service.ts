import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo
      .createQueryBuilder('role')
      .loadRelationCountAndMap('role.userCount', 'role.users')
      .orderBy('role.isSystem', 'DESC')
      .addOrderBy('role.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    const role = this.roleRepo.create(dto);
    return this.roleRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException(
        'No se puede cambiar el nombre de un rol de sistema',
      );
    }

    if (
      role.name === 'ADMIN' &&
      dto.canManageUsers !== undefined &&
      dto.canManageUsers === false
    ) {
      throw new BadRequestException(
        'No se puede quitar el permiso de gestion de usuarios al rol ADMIN',
      );
    }

    if (dto.name && dto.name !== role.name) {
      const conflict = await this.roleRepo.findOne({
        where: { name: dto.name },
      });

      if (conflict) {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
    }

    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException(
        'No se puede eliminar un rol de sistema',
      );
    }

    const count = await this.userRepo.count({
      where: { role: { id } },
    });

    if (count > 0) {
      throw new BadRequestException(
        'No se puede eliminar un rol con usuarios asignados',
      );
    }

    await this.roleRepo.delete(id);
  }
}
