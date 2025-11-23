import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto, @Request() req) {
    return this.todosService.create(createTodoDto, req.user.id);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('date') date?: string,
    @Query('completed') completed?: string,
  ) {
    const params: any = {};
    
    if (date) {
      params.date = date;
    }
    
    if (completed !== undefined) {
      params.completed = completed === 'true';
    }

    return this.todosService.findAll(req.user.sub, params);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.todosService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Request() req,
  ) {
    return this.todosService.update(id, updateTodoDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.todosService.remove(id, req.user.id);
  }

  @Patch(':id/complete')
  markComplete(@Param('id') id: string, @Request() req) {
    return this.todosService.markComplete(id, req.user.id);
  }

  @Patch(':id/incomplete')
  markIncomplete(@Param('id') id: string, @Request() req) {
    return this.todosService.markIncomplete(id, req.user.id);
  }
}
