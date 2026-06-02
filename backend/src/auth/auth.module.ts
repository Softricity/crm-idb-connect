import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PartnersModule } from '../partners/partners.module';
import { AgentsModule } from '../agents/agents.module'; // 👈 Import AgentsModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    PartnersModule, 
    AgentsModule, // 👈 Add to imports
    PermissionsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' }, // 1 day token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
