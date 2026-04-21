// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private prisma: PrismaService) {}

  private parseBoolean(value?: string): boolean | null {
    if (value === undefined) return null;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return null;
  }

  private async resolveTransactionalTransportConfig() {
    const envUser = process.env.SMTP_USER;
    const envPass = process.env.SMTP_PASS;
    const envHost = process.env.SMTP_HOST;
    const envPortRaw = process.env.SMTP_PORT;
    const envPort = envPortRaw ? parseInt(envPortRaw, 10) : 587;
    const envSecureRaw = this.parseBoolean(process.env.SMTP_SECURE);
    
    // Default logic: If not specified, use SSL (secure: true) for port 465, else TLS (secure: false)
    const envSecure = envSecureRaw === null ? envPort === 465 : envSecureRaw;
    
    const fromEmail = (process.env.SMTP_FROM_EMAIL || envUser || '').trim();
    const fromName = (process.env.SMTP_FROM_NAME || 'IDB Connect').trim();

    if (!envUser || !envPass) {
      this.logger.warn(
        '[MAIL_CONFIG_MISSING] SMTP_USER/SMTP_PASS are required. Transactional email send skipped.',
      );
      return null;
    }

    return {
      host: envHost || 'smtpout.secureserver.net', // Defaulting to GoDaddy SMTP if none provided
      port: envPort,
      secure: envSecure,
      user: envUser,
      pass: envPass,
      fromEmail: `"${fromName}" <${fromEmail || envUser}>`,
      source: envHost ? 'custom-smtp' : 'godaddy-default',
    };
  }

  private async sendEmail(mailOptions: { to: string; subject: string; html: string }) {
    const config = await this.resolveTransactionalTransportConfig();
    if (!config) {
      this.logger.error(`[MAIL_SEND_FAILED] No SMTP configuration found. skipping email to ${mailOptions.to}`);
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      const info = await transporter.sendMail({
        from: config.fromEmail,
        ...mailOptions,
      });

      this.logger.log(
        `[MAIL_SEND_SUCCESS] source=${config.source} to=${mailOptions.to} subject="${mailOptions.subject}" messageId=${info.messageId}`,
      );
      return info;
    } catch (error) {
      this.logger.error(
        `[MAIL_SEND_FAILED] source=${config.source} to=${mailOptions.to} subject="${mailOptions.subject}"`,
        error instanceof Error ? {
          message: error.message,
          code: (error as any).code,
          command: (error as any).command,
          response: (error as any).response,
          stack: error.stack
        } : error
      );
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, password: string) {
    const mailOptions = {
      to: email,
      subject: 'Welcome to Your Student Panel!',
      html: `
        <h1>Welcome!</h1>
        <p>Your account for the student panel has been created.</p>
        <p>You can now log in using these credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>Click here to login: <a href="https://student.idbconnect.global/login">Student Panel Login</a></p>
        <p>Thanks,</p>
        <p>The IDB Connect Team</p>
      `,
    };

    try {
      await this.sendEmail(mailOptions);
    } catch (error) {
      // Error is already logged in detail by sendEmail
    }
  }

  // --- Template Management ---

  async findAllTemplates(category?: string) {
    return this.prisma.emailTemplate.findMany({
      where: category ? { category } : {},
      orderBy: { name: 'asc' },
    });
  }

  async findOneTemplate(id: string) {
    return this.prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.emailTemplate.create({
      data: dto as any,
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    return this.prisma.emailTemplate.update({
      where: { id },
      data: dto as any,
    });
  }

  async removeTemplate(id: string) {
    return this.prisma.emailTemplate.delete({
      where: { id },
    });
  }

  // --- Dynamic Sending ---

  async sendTemplateEmail(email: string, templateName: string, data: Record<string, any>) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { name: templateName },
    });

    if (!template) {
      this.logger.warn(`[MAIL_SEND_SKIPPED] template_not_found=${templateName} recipient=${email}`);
      return;
    }

    const category = String(template.category || '').trim().toLowerCase();
    if (category === 'campaign') {
      this.logger.warn(
        `[MAIL_SEND_SKIPPED] template=${templateName} category=campaign recipient=${email} reason=campaign_deferred`,
      );
      return;
    }

    let html = template.body;
    let subject = template.subject;

    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(placeholder, String(value || ''));
      subject = subject.replace(placeholder, String(value || ''));
    });

    const mailOptions = {
      to: email,
      subject: subject,
      html: html,
    };

    try {
      await this.sendEmail(mailOptions);
    } catch (error) {
      // Error is already logged in detail by sendEmail
    }
  }

  async testConnection(to?: string) {
    const config = await this.resolveTransactionalTransportConfig();
    if (!config) {
      throw new Error('SMTP configuration missing');
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    try {
      await transporter.verify();
      this.logger.log(`[SMTP_TEST_SUCCESS] Connection verified for ${config.host}`);
      
      if (to) {
        await transporter.sendMail({
          from: config.fromEmail,
          to,
          subject: 'SMTP Connection Test - IDB Connect',
          html: `<p>SMTP connection successfully verified for <strong>${config.user}</strong>.</p>`,
        });
        this.logger.log(`[SMTP_TEST_EMAIL_SENT] to=${to}`);
      }
      
      return { 
        status: 'success', 
        message: 'SMTP connection verified successfully',
        config: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user
        }
      };
    } catch (error) {
      this.logger.error(`[SMTP_TEST_FAILED] host=${config.host}`, error);
      throw error;
    }
  }
}
