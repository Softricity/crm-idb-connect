import 'dotenv/config'; 

import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { ValidationPipe } from '@nestjs/common';

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', "https://tw1lcrj1-3000.inc1.devtunnels.ms", "https://idbconnect.global", "https://student.idbconnect.global", "https://inquiry.idbconnect.global", "https://b2b.idbconnect.global", "http://localhost:3002"], // Your Next.js app's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const uploadsRoot = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsRoot)) {
    mkdirSync(uploadsRoot, { recursive: true });
  }
  app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });
  
  await app.listen(process.env.PORT ?? 5005);
}
bootstrap();
