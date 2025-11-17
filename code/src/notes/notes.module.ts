// src/notes/notes.module.ts
import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [NotesController],
  providers: [NotesService, PrismaService],
})
export class NotesModule {}