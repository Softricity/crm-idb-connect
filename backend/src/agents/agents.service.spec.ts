import { AgentsService } from './agents.service';

describe('AgentsService', () => {
  const prismaMock = {
    agentInquiry: {
      create: jest.fn(),
    },
  } as any;

  const supabaseMock = {} as any;
  const mailServiceMock = {
    sendTemplateEmail: jest.fn(),
  } as any;

  let service: AgentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgentsService(prismaMock, supabaseMock, mailServiceMock);
  });

  it('keeps inquiry email template flow routed through MailService', async () => {
    prismaMock.agentInquiry.create.mockResolvedValue({ id: 'inq-1', email: 'agent@example.com' });
    mailServiceMock.sendTemplateEmail.mockResolvedValue(undefined);

    const result = await service.createInquiry({
      name: 'Demo Agent',
      email: 'agent@example.com',
      mobile: '9000000000',
      company_name: 'Demo Co',
    });

    expect(result).toEqual(expect.objectContaining({ id: 'inq-1' }));
    expect(mailServiceMock.sendTemplateEmail).toHaveBeenCalledWith(
      'agent@example.com',
      'INQUIRY_RECEIVED',
      expect.objectContaining({
        name: 'Demo Agent',
        company: 'Demo Co',
      }),
    );
  });
});

