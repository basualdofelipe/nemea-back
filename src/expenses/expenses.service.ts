import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from '../catalogs/entities/expense-category.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
  ) {}

  async findAll(query: QueryExpensesDto): Promise<Expense[]> {
    const qb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC');

    if (query.categoryId) {
      qb.andWhere('expense.category_id = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.dateFrom) {
      qb.andWhere('expense.date >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      qb.andWhere('expense.date <= :dateTo', {
        dateTo: query.dateTo,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({ where: { id } });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return expense;
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoria de gasto no encontrada');
    }

    const expense = this.expenseRepo.create({
      amount: String(dto.amount),
      concept: dto.concept,
      date: dto.date,
      category,
    });

    return this.expenseRepo.save(expense);
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Categoria de gasto no encontrada');
      }

      expense.category = category;
    }

    if (dto.amount !== undefined) {
      expense.amount = String(dto.amount);
    }

    if (dto.concept !== undefined) {
      expense.concept = dto.concept;
    }

    if (dto.date !== undefined) {
      expense.date = dto.date;
    }

    return this.expenseRepo.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    await this.expenseRepo.remove(expense);
  }
}
