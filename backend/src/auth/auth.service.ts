import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PartnersService } from '../partners/partners.service';
import { MailService } from '../mail/mail.service';
import { AgentsService } from '../agents/agents.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class AuthService {
  constructor(
    private partnersService: PartnersService,
    private agentsService: AgentsService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Try to find as Internal Partner
    const partner = await this.partnersService.findOneByEmail(email);
    if (partner) {
      const isMatch = await bcrypt.compare(pass, partner.password);
      if (isMatch) {
        const { password, ...result } = partner;
        return { ...result, type: 'partner' };
      }
    }

    // 2. If not found, Try to find as Agent
    const agent = await this.agentsService.findByEmail(email);
    if (agent) {
      if (agent.status === 'REJECTED' || !agent.is_active) {
         return null; 
      }

      const isMatch = await bcrypt.compare(pass, agent.password);
      if (isMatch) {
        const { password, ...result } = agent;
        return { ...result, type: 'agent' };
      }
    }

    // 3. Team member login
    const teamMember = await this.agentsService.findTeamMemberByEmail(email);
    if (teamMember) {
      const isMatch = await bcrypt.compare(pass, teamMember.password);
      if (isMatch && teamMember.is_active) {
        if (!teamMember.agent || !teamMember.agent.is_active || teamMember.agent.status === 'REJECTED') {
          return null;
        }
        const { password, ...result } = teamMember;
        return { ...result, type: 'agent_team_member' };
      }
    }

    return null;
  }

  async login(user: any) {
    let payload: any = {};
    let responseUser: any = {};

    if (user.type === 'partner') {
      const authz = await this.permissionsService.resolveEffectivePermissionsForPartner(user.id);
      const permissions = authz.permissions;
      
      payload = {
        email: user.email,
        sub: user.id,
        name: user.name,
        role: user.role.name,
        type: 'partner',
        permissions: permissions,
        department_ids: authz.department_ids,
        primary_department_id: authz.primary_department_id,
        authz_source: authz.source,
        branch_id: user.branch_id,
        branch_type: user.branch?.type
      };

      responseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: permissions,
        department_ids: authz.department_ids,
        primary_department_id: authz.primary_department_id,
        authz_source: authz.source,
        branch_id: user.branch_id,
        type: 'partner'
      };

    } else if (user.type === 'agent') {
      payload = {
        email: user.email,
        sub: user.id,
        name: user.name,
        role: 'agent',
        permissions: [],
        branch_id: user.branch_id,
        branch_type: 'agent_portal',
        type: 'agent',
        contract_approved: !!user.contract_approved,
      };

      responseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'agent',
        permissions: [],
        department_ids: [],
        primary_department_id: null,
        authz_source: 'role',
        type: 'agent',
        branch_id: user.branch_id,
        contract_approved: !!user.contract_approved,
      };
    } else {
      // agent_team_member
      payload = {
        email: user.email,
        sub: user.id,
        name: user.name,
        role: 'agent',
        permissions: [],
        branch_type: 'agent_portal',
        type: 'agent_team_member',
        parent_agent_id: user.agent_id,
        contract_approved: !!user.agent?.contract_approved,
      };
      responseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'agent_team_member',
        permissions: [],
        department_ids: [],
        primary_department_id: null,
        authz_source: 'role',
        type: 'agent_team_member',
        parent_agent_id: user.agent_id,
        contract_approved: !!user.agent?.contract_approved,
      };
    }

    return {
      access_token: this.jwtService.sign(payload),
      partner: responseUser,
    };
  }

  async getCurrentSession(authUser: any) {
    const userId = authUser?.id || authUser?.userId;
    const type = authUser?.type || 'partner';

    if (!userId) {
      return { partner: null };
    }

    if (type === 'partner') {
      const user = await this.partnersService.findOneForAuthById(userId);
      if (!user) return { partner: null };

      const authz = await this.permissionsService.resolveEffectivePermissionsForPartner(user.id);

      return {
        partner: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name,
          permissions: authz.permissions,
          department_ids: authz.department_ids,
          primary_department_id: authz.primary_department_id,
          authz_source: authz.source,
          branch_id: user.branch_id,
          branch_name: user.branch?.name || null,
          branch_type: user.branch?.type || null,
          type: 'partner',
        },
      };
    }

    if (type === 'agent') {
      const agent = await this.agentsService.findOne(userId);
      if (!agent || agent.status === 'REJECTED' || !agent.is_active) return { partner: null };
      return {
        partner: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          role: 'agent',
          permissions: [],
          department_ids: [],
          primary_department_id: null,
          authz_source: 'role',
          type: 'agent',
          branch_id: agent.branch_id || null,
          contract_approved: !!agent.contract_approved,
        },
      };
    }

    const teamMember = await this.agentsService.findTeamMemberById(userId);
    if (!teamMember || !teamMember.is_active || !teamMember.agent || teamMember.agent.status === 'REJECTED' || !teamMember.agent.is_active) {
      return { partner: null };
    }
    return {
      partner: {
        id: teamMember.id,
        name: teamMember.name,
        email: teamMember.email,
        role: 'agent_team_member',
        permissions: [],
        department_ids: [],
        primary_department_id: null,
        authz_source: 'role',
        type: 'agent_team_member',
        parent_agent_id: teamMember.agent_id,
        contract_approved: !!teamMember.agent?.contract_approved,
      },
    };
  }

  async exchangeStudentPanelStaffToken(staffToken: string) {
    if (!staffToken) {
      throw new UnauthorizedException('Missing staff token.');
    }

    let decoded: any;
    try {
      decoded = this.jwtService.verify(staffToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired staff token.');
    }

    if (decoded?.purpose !== 'student_panel_staff_access' || !decoded?.leadId) {
      throw new ForbiddenException('Invalid access token purpose.');
    }

    const lead = await this.prisma.leads.findUnique({
      where: { id: decoded.leadId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        preferred_course: true,
        preferred_country: true,
        status: true,
        type: true,
        is_flagged: true,
        created_at: true,
        created_by: true,
        assigned_to: true,
        branch_id: true,
      },
    });

    if (!lead) {
      throw new UnauthorizedException('Lead not found.');
    }

    const studentSessionToken = this.jwtService.sign(
      {
        purpose: 'student_panel_session',
        sub: lead.id,
        leadId: lead.id,
        email: lead.email,
        type: 'lead',
        staff_context: {
          staff_user_id: decoded?.staffUserId || null,
          permissions: Array.isArray(decoded?.permissions) ? decoded.permissions : [],
          department_ids: Array.isArray(decoded?.department_ids) ? decoded.department_ids : [],
          primary_department_id: decoded?.primary_department_id || null,
        },
      },
      { expiresIn: '7d' },
    );

    return {
      access_token: studentSessionToken,
      lead,
      staff_context: {
        staff_user_id: decoded?.staffUserId || null,
        permissions: Array.isArray(decoded?.permissions) ? decoded.permissions : [],
        department_ids: Array.isArray(decoded?.department_ids) ? decoded.department_ids : [],
        primary_department_id: decoded?.primary_department_id || null,
      },
    };
  }

  async resetPassword(user: any, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const userId = user.id || user.userId;

    if (user.type === 'partner') {
      await this.prisma.partners.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } else if (user.type === 'agent') {
      await this.prisma.agent.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } else if (user.type === 'agent_team_member') {
      await this.prisma.agentTeamMember.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    } else {
      throw new BadRequestException('Invalid user type');
    }

    return { message: 'Password reset successfully' };
  }

  private generateRandomPassword(length = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
    let password = '';
    for (let i = 0; i < length; i += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    let user: any = null;
    let userType: 'partner' | 'agent' | 'agent_team_member' | null = null;

    // 1. Search Agent
    const agent = await this.prisma.agent.findUnique({ where: { email } });
    if (agent) {
      user = agent;
      userType = 'agent';
    } else {
      // 2. Search Team Member
      const teamMember = await this.prisma.agentTeamMember.findUnique({ where: { email } });
      if (teamMember) {
        user = teamMember;
        userType = 'agent_team_member';
      } else {
        // 3. Search Partner
        const partner = await this.prisma.partners.findUnique({ where: { email } });
        if (partner) {
          user = partner;
          userType = 'partner';
        }
      }
    }

    if (!user) {
      // Prevent email enumeration
      return { message: 'If this email exists in our records, a temporary password has been sent.' };
    }

    const tempPassword = this.generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    try {
      if (userType === 'agent') {
        // Send email first
        await this.mailService.sendTemplateEmail(user.email, 'AGENT_ONBOARDING', {
          name: user.name,
          company: user.agency_name,
          email: user.email,
          password: tempPassword,
          login_url: 'https://b2b.idbconnect.global/login',
        });
        // Update database only if email succeeded
        await this.prisma.agent.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      } else if (userType === 'agent_team_member') {
        await this.mailService.sendTemplateEmail(user.email, 'AGENT_ONBOARDING', {
          name: user.name,
          company: 'Agent Portal Team',
          email: user.email,
          password: tempPassword,
          login_url: 'https://b2b.idbconnect.global/login',
        });
        await this.prisma.agentTeamMember.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      } else if (userType === 'partner') {
        await this.mailService.sendWelcomeEmail(user.email, tempPassword);
        await this.prisma.partners.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
      }
    } catch (err) {
      console.error('Forgot password action error:', err);
      throw new InternalServerErrorException(
        'Failed to send password recovery email. Please check your SMTP settings or try again later.'
      );
    }

    return { message: 'If this email exists in our records, a temporary password has been sent.' };
  }
}
