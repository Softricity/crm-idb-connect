import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PartnersService } from '../partners/partners.service';
import { AgentsService } from '../agents/agents.service'; // 👈 Import AgentsService
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private partnersService: PartnersService,
    private agentsService: AgentsService, // 👈 Inject it
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Try to find as Internal Partner
    const partner = await this.partnersService.findOneByEmail(email);
    if (partner) {
      const isMatch = await bcrypt.compare(pass, partner.password);
      if (isMatch) {
        const { password, ...result } = partner;
        return { ...result, type: 'partner' }; // Tag as partner
      }
    }

    // 2. If not found, Try to find as Agent
    const agent = await this.agentsService.findByEmail(email);
    if (agent) {
      // ✅ Security Check: Agent must be APPROVED and ACTIVE
      if (agent.status !== 'APPROVED' || !agent.is_active) {
         // You might want to throw a specific error or just return null
         // returning null triggers "Invalid Credentials" generic message
         return null; 
      }

      const isMatch = await bcrypt.compare(pass, agent.password);
      if (isMatch) {
        const { password, ...result } = agent;
        return { ...result, type: 'agent' }; // Tag as agent
      }
    }

    return null;
  }

  async login(user: any) {
    // 1. Define Payload based on User Type
    let payload: any = {};
    let responseUser: any = {};

    if (user.type === 'partner') {
      // --- PARTNER LOGIC (Existing) ---
      const permissions = user.role?.role_permissions?.map((rp: any) => rp.permission.name) || [];
      
      payload = {
        email: user.email,
        sub: user.id,
        name: user.name,
        role: user.role.name,
        permissions: permissions,
        branch_id: user.branch_id,
        branch_type: user.branch?.type
      };

      responseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: permissions,
        branch_id: user.branch_id,
        type: 'partner'
      };

    } else {
      // --- AGENT LOGIC (New) ---
      // Agents don't have dynamic roles/permissions tables yet, so we hardcode "agent"
      
      payload = {
        email: user.email,
        sub: user.id,
        name: user.name,
        role: 'agent', // Hardcoded role
        permissions: [], // Agents generally have fixed permissions logic in FE
        branch_id: null, // Agents usually belong to Head Office logically or null
        branch_type: 'agent_portal'
      };

      responseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'agent',
        permissions: [],
        type: 'agent'
      };
    }

    // 2. Return Token
    return {
      access_token: this.jwtService.sign(payload),
      partner: responseUser, // Frontend expects "partner" key
    };
  }
}