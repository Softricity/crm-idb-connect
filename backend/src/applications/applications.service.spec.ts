import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  const prismaMock = {
    leads: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    applications: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  } as any;

  const supabaseMock = {} as any;
  const mailServiceMock = {
    sendWelcomeEmail: jest.fn(),
  } as any;

  let service: ApplicationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ApplicationsService(prismaMock, supabaseMock, mailServiceMock);
  });

  it('keeps lead-to-application conversion welcome email flow for staff users', async () => {
    jest.spyOn(service as any, 'validateLeadAccess').mockResolvedValue(undefined);
    prismaMock.applications.findFirst.mockResolvedValue(null);
    prismaMock.applications.create.mockResolvedValue({ id: 'app-1', lead_id: 'lead-1' });
    prismaMock.leads.findUnique.mockResolvedValue({ id: 'lead-1', email: 'lead@example.com' });
    prismaMock.leads.update.mockResolvedValue({});
    mailServiceMock.sendWelcomeEmail.mockResolvedValue(undefined);

    const result = await service.convertLeadToApplication('lead-1', {
      id: 'staff-1',
      role: { name: 'admin' },
      role_name: 'admin',
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: 'app-1' }));
    expect(mailServiceMock.sendWelcomeEmail).toHaveBeenCalledWith(
      'lead@example.com',
      expect.any(String),
    );
  });
});
