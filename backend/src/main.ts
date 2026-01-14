import 'dotenv/config'; 

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', "https://tw1lcrj1-3000.inc1.devtunnels.ms", "https://idbconnect.global", "https://student.idbconnect.global", "https://inquiry.idbconnect.global", "https://b2b.idbconnect.global"], // Your Next.js app's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 5005);
}
bootstrap();
