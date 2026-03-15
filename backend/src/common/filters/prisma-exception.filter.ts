import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const target = Array.isArray(exception.meta?.target)
      ? exception.meta?.target.join(', ')
      : exception.meta?.target;

    let mapped:
      | ConflictException
      | NotFoundException
      | BadRequestException;

    switch (exception.code) {
      case 'P2002':
        mapped = new ConflictException(
          `Unique constraint failed on field(s): ${target || 'unknown'}`,
        );
        break;
      case 'P2025':
        mapped = new NotFoundException(
          'Requested record was not found for this operation.',
        );
        break;
      case 'P2003':
        mapped = new BadRequestException(
          `Foreign key constraint failed on field: ${target || 'unknown'}`,
        );
        break;
      case 'P2011':
        mapped = new BadRequestException(
          `Null constraint violation on field: ${target || 'unknown'}`,
        );
        break;
      default:
        mapped = new BadRequestException(exception.message);
        break;
    }

    const body = mapped.getResponse();
    const status = mapped.getStatus?.() ?? HttpStatus.BAD_REQUEST;
    response.status(status).json(
      typeof body === 'string'
        ? { statusCode: status, message: body }
        : body,
    );
  }
}
