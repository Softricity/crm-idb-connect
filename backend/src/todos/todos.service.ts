import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async create(createTodoDto: CreateTodoDto, userId: string) {
    const { title, dueDate } = createTodoDto;

    return this.prisma.todos.create({
      data: {
        id: crypto.randomUUID(),
        title,
        created_by: userId,
        completed: false,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        partners: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, params?: { date?: string; completed?: boolean }) {
    const where: any = {
      created_by: userId,
    };

    if (params?.completed !== undefined) {
      where.completed = params.completed;
    }

    if (params?.date) {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.dueDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return this.prisma.todos.findMany({
      where,
      include: {
        partners: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
      ],
    });
  }

  async findOne(id: string, userId: string) {
    const todo = await this.prisma.todos.findUnique({
      where: { id },
      include: {
        partners: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Ensure user can only access their own todos
    if (todo.created_by !== userId) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto, userId: string) {
    // Verify todo exists and belongs to user
    await this.findOne(id, userId);

    const updateData: any = {};

    if (updateTodoDto.title !== undefined) {
      updateData.title = updateTodoDto.title;
    }

    if (updateTodoDto.completed !== undefined) {
      updateData.completed = updateTodoDto.completed;
    }

    if (updateTodoDto.dueDate !== undefined) {
      updateData.dueDate = updateTodoDto.dueDate ? new Date(updateTodoDto.dueDate) : null;
    }

    return this.prisma.todos.update({
      where: { id },
      data: updateData,
      include: {
        partners: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verify todo exists and belongs to user
    await this.findOne(id, userId);

    return this.prisma.todos.delete({
      where: { id },
    });
  }

  async markComplete(id: string, userId: string) {
    return this.update(id, { completed: true }, userId);
  }

  async markIncomplete(id: string, userId: string) {
    return this.update(id, { completed: false }, userId);
  }
}
