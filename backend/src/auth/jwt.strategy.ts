// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // This method runs after the token is successfully verified
  async validate(payload: any) {
    // Return both `userId` (used across controllers/services) and `id` for compatibility
    return {
      userId: payload.sub,
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions || [],
      branch_id: payload.branch_id,     // <--- Make available to Controllers
      branch_type: payload.branch_type, // <--- Make available to Controllers
    };
  }
}