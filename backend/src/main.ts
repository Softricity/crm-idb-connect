import 'dotenv/config'; 

import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const bootstrapLogger = new Logger('Bootstrap');
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

  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const secureRaw = (process.env.SMTP_SECURE || '').trim().toLowerCase();
  const smtpSecure =
    secureRaw === 'true' || secureRaw === '1' || secureRaw === 'yes'
      ? true
      : secureRaw === 'false' || secureRaw === '0' || secureRaw === 'no'
        ? false
        : smtpPort === 465;
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser || '';
  const fromName = process.env.SMTP_FROM_NAME?.trim() || 'IDB Connect';

  if (smtpUser && smtpPass) {
    bootstrapLogger.log(
      `[MAIL_STARTUP] Transactional email service ACTIVE via Gmail/SMTP env (host=${smtpHost}, port=${smtpPort}, secure=${smtpSecure}, from="${fromName}" <${fromEmail}>)`,
    );
  } else {
    bootstrapLogger.warn(
      '[MAIL_STARTUP] Transactional email service INACTIVE: SMTP_USER/SMTP_PASS missing. Email sends will be skipped.',
    );
  }
  
  await app.listen(process.env.PORT ?? 5005);
}
bootstrap();
