// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { PartnersService } from '../partners/partners.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private partnersService: PartnersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validates a partner's credentials.
   * @param email The partner's email
   * @param pass The partner's plaintext password
   * @returns The partner object without the password, or null if invalid
   */
  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Find the partner by email
    const partner = await this.partnersService.findOneByEmail(email);

    if (partner) {
      // 2. Compare the plaintext password with the hashed password from the DB
      const isMatch = await bcrypt.compare(pass, partner.password);
      if (isMatch) {
        // 3. If they match, return the user object (minus the password)
        const { password, ...result } = partner;
        return result;
      }
    }
    // 4. If user not found or password doesn't match, return null
    return null;
  }

  /**
   * Generates a JWT for a validated user.
   * @param partner The user object returned from validateUser
   * @returns An object containing the access_token and partner info
   */
  async login(partner: any) {
    // Extract permissions from role_permissions
    const permissions = partner.role?.role_permissions?.map(
      (rp: any) => rp.permission.name
    ) || [];

    const payload = {
      email: partner.email,
      sub: partner.id,
      name: partner.name,
      role: partner.role.name,
      permissions: permissions,
    };
    return {
      access_token: this.jwtService.sign(payload),
      payload: payload
    };
  }
}