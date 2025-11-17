// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(email: string, password: string) {
    const mailOptions = {
      from: `"IDB Connect" <${process.env.SMTP_USER}>`,
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
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    }
  }
}