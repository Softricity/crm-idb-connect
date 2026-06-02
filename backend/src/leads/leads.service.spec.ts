import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  const prismaMock = {
    leads: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    partners: {
      findUnique: jest.fn(),
    },
    branch: {
      findFirst: jest.fn(),
    },
    department_order: {
      findFirst: jest.fn(),
    },
    department_status: {
      findFirst: jest.fn(),
    },
    department_assignment_cursor: {
      findUnique: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
    },
    agentTeamMember: {
      findUnique: jest.fn(),
    },
  } as any;

  const mailServiceMock = {
    sendWelcomeEmail: jest.fn(),
  } as any;

  const timelineServiceMock = {
    logLeadCreated: jest.fn(),
    logAssignmentChange: jest.fn(),
  } as any;

  let service: LeadsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.leads.findFirst.mockResolvedValue(null);
    prismaMock.department_order.findFirst.mockResolvedValue(null);
    prismaMock.department_status.findFirst.mockResolvedValue(null);
    prismaMock.partners.findUnique.mockResolvedValue(null);
    prismaMock.branch.findFirst.mockResolvedValue(null);
    prismaMock.agent.findUnique.mockResolvedValue(null);
    prismaMock.agentTeamMember.findUnique.mockResolvedValue(null);
    prismaMock.department_assignment_cursor.findUnique.mockResolvedValue(null);
    service = new LeadsService(prismaMock, mailServiceMock, timelineServiceMock);
  });

  it('sends welcome email on lead creation', async () => {
    prismaMock.leads.create.mockResolvedValue({
      id: 'lead-1',
      email: 'lead@example.com',
    });
    mailServiceMock.sendWelcomeEmail.mockResolvedValue(undefined);

    const result = await service.create({
      name: 'Lead User',
      email: 'lead@example.com',
      mobile: '9999999999',
    } as any);

    expect(result.id).toBe('lead-1');
    expect(mailServiceMock.sendWelcomeEmail).toHaveBeenCalledWith(
      'lead@example.com',
      expect.any(String),
    );
  });

  it('does not fail lead creation when welcome email sending fails', async () => {
    prismaMock.leads.create.mockResolvedValue({
      id: 'lead-2',
      email: 'lead2@example.com',
    });
    mailServiceMock.sendWelcomeEmail.mockRejectedValue(new Error('smtp error'));

    await expect(
      service.create({
        name: 'Lead User 2',
        email: 'lead2@example.com',
        mobile: '8888888888',
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'lead-2',
        email: 'lead2@example.com',
      }),
    );
  });
});

