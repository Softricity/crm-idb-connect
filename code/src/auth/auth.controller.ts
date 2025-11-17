// src/auth/auth.controller.ts
import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/login
   * @param req The request object
   * @param loginDto The email/password from the body
   */
  @Public()
  @UseGuards(AuthGuard('local')) // <-- This triggers the LocalStrategy
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    // If LocalStrategy passes, req.user is populated.
    // We just need to sign the token.
    return this.authService.login(req.user);
  }
}