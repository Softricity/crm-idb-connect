import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  const sendMailMock = jest.fn();
  const prismaMock = {
    emailTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as any;

  let service: MailService;

  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    service = new MailService(prismaMock);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock.mockResolvedValue({}),
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends non-campaign template email via env SMTP defaults', async () => {
    process.env.SMTP_USER = 'user@gmail.com';
    process.env.SMTP_PASS = 'app-password';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;

    prismaMock.emailTemplate.findUnique.mockResolvedValue({
      name: 'INQUIRY_RECEIVED',
      category: 'inquiry',
      subject: 'Hi {{name}}',
      body: '<p>Hello {{name}}</p>',
    });

    await service.sendTemplateEmail('lead@example.com', 'INQUIRY_RECEIVED', { name: 'John' });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@gmail.com',
        pass: 'app-password',
      },
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'lead@example.com',
        subject: 'Hi John',
      }),
    );
  });

  it('skips campaign templates', async () => {
    process.env.SMTP_USER = 'user@gmail.com';
    process.env.SMTP_PASS = 'app-password';

    prismaMock.emailTemplate.findUnique.mockResolvedValue({
      name: 'SPRING_CAMPAIGN',
      category: 'Campaign',
      subject: 'Sale',
      body: '<p>Sale</p>',
    });

    await service.sendTemplateEmail('lead@example.com', 'SPRING_CAMPAIGN', {});

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('does not send when SMTP credentials are missing', async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    prismaMock.emailTemplate.findUnique.mockResolvedValue({
      name: 'INQUIRY_RECEIVED',
      category: 'inquiry',
      subject: 'Hello',
      body: '<p>Hello</p>',
    });

    await service.sendTemplateEmail('lead@example.com', 'INQUIRY_RECEIVED', {});

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

