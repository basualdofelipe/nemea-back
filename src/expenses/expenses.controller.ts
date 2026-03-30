import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { Expense } from './entities/expense.entity';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermission('can_view_expenses')
  @ApiOperation({ summary: 'Listar gastos con filtros opcionales', description: 'Requires: can_view_expenses' })
  @ApiResponse({ status: 200, description: 'Lista de gastos' })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: QueryExpensesDto,
  ): Promise<Expense[]> {
    return this.expensesService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('can_view_expenses')
  @ApiOperation({ summary: 'Obtener un gasto por ID', description: 'Requires: can_view_expenses' })
  @ApiResponse({ status: 200, description: 'Gasto encontrado' })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Expense> {
    return this.expensesService.findOne(id);
  }

  @Post()
  @RequirePermission('can_edit_expenses')
  @ApiOperation({ summary: 'Crear un gasto', description: 'Requires: can_edit_expenses' })
  @ApiResponse({ status: 201, description: 'Gasto creado exitosamente' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — insufficient permissions',
  })
  async create(@Body() dto: CreateExpenseDto): Promise<Expense> {
    return this.expensesService.create(dto);
  }

  @Put(':id')
  @RequirePermission('can_edit_expenses')
  @ApiOperation({ summary: 'Actualizar un gasto', description: 'Requires: can_edit_expenses' })
  @ApiResponse({ status: 200, description: 'Gasto actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — insufficient permissions',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<Expense> {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('can_edit_expenses')
  @ApiOperation({ summary: 'Eliminar un gasto', description: 'Requires: can_edit_expenses' })
  @ApiResponse({ status: 200, description: 'Gasto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — insufficient permissions',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.expensesService.remove(id);
  }
}
