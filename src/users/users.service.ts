import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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

  async deactivate(id: string): Promise<void> {
    await this.usersRepository.update(id, { isActive: false });
  }

  async activate(id: string): Promise<void> {
    await this.usersRepository.update(id, { isActive: true });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
