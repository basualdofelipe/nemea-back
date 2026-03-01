import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepo.find({ order: { name: 'ASC' } });
  }

  async findActive(): Promise<Supplier[]> {
    return this.supplierRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    try {
      const supplier = this.supplierRepo.create(dto);
      return await this.supplierRepo.save(supplier);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Ya existe un proveedor activo con ese nombre',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);

    try {
      const merged = this.supplierRepo.merge(supplier, dto);
      return await this.supplierRepo.save(merged);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Ya existe un proveedor activo con ese nombre',
        );
      }
      throw error;
    }
  }

  async toggleStatus(id: string): Promise<Supplier> {
    const supplier = await this.findOne(id);
    supplier.isActive = !supplier.isActive;
    return this.supplierRepo.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);

    try {
      await this.supplierRepo.remove(supplier);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23503'
      ) {
        throw new ConflictException(
          'No se puede eliminar: este proveedor tiene insumos asociados',
        );
      }
      throw error;
    }
  }
}
