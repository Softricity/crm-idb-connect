import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const partnersServiceMock = {
    findOneByEmail: jest.fn(),
    findOneForAuthById: jest.fn(),
  } as any;

  const agentsServiceMock = {
    findByEmail: jest.fn(),
    findTeamMemberByEmail: jest.fn(),
    findOne: jest.fn(),
    findTeamMemberById: jest.fn(),
  } as any;

  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  } as any;

  const prismaMock = {} as any;
  const permissionsServiceMock = {
    resolveEffectivePermissionsForPartner: jest.fn(),
  } as any;
  const mailServiceMock = {
    sendTemplateEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      partnersServiceMock,
      agentsServiceMock,
      jwtServiceMock,
      prismaMock,
      permissionsServiceMock,
      mailServiceMock,
    );
  });

  it('allows pending agents to authenticate for onboarding', async () => {
    partnersServiceMock.findOneByEmail.mockResolvedValue(null);
    agentsServiceMock.findByEmail.mockResolvedValue({
      id: 'agent-1',
      email: 'agent@example.com',
      password: 'hashed',
      name: 'Agent One',
      status: 'PENDING',
      is_active: true,
      branch_id: 'branch-1',
      contract_approved: false,
    });
    agentsServiceMock.findTeamMemberByEmail.mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtServiceMock.sign.mockReturnValue('token');

    const result = await service.validateUser('agent@example.com', 'secret');

    expect(result).toEqual(
      expect.objectContaining({
        id: 'agent-1',
        type: 'agent',
      }),
    );
  });

  it('blocks rejected agents from authenticating', async () => {
    partnersServiceMock.findOneByEmail.mockResolvedValue(null);
    agentsServiceMock.findByEmail.mockResolvedValue({
      id: 'agent-2',
      email: 'rejected@example.com',
      password: 'hashed',
      name: 'Rejected Agent',
      status: 'REJECTED',
      is_active: true,
    });
    agentsServiceMock.findTeamMemberByEmail.mockResolvedValue(null);

    const result = await service.validateUser('rejected@example.com', 'secret');

    expect(result).toBeNull();
  });

  it('blocks team members from authenticating if parent agent is inactive', async () => {
    partnersServiceMock.findOneByEmail.mockResolvedValue(null);
    agentsServiceMock.findByEmail.mockResolvedValue(null);
    agentsServiceMock.findTeamMemberByEmail.mockResolvedValue({
      id: 'member-1',
      email: 'member@example.com',
      password: 'hashed',
      is_active: true,
      agent_id: 'agent-inactive',
      agent: {
        id: 'agent-inactive',
        is_active: false,
        status: 'APPROVED',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUser('member@example.com', 'secret');
    expect(result).toBeNull();
  });

  it('blocks team members from authenticating if parent agent is rejected', async () => {
    partnersServiceMock.findOneByEmail.mockResolvedValue(null);
    agentsServiceMock.findByEmail.mockResolvedValue(null);
    agentsServiceMock.findTeamMemberByEmail.mockResolvedValue({
      id: 'member-2',
      email: 'member2@example.com',
      password: 'hashed',
      is_active: true,
      agent_id: 'agent-rejected',
      agent: {
        id: 'agent-rejected',
        is_active: true,
        status: 'REJECTED',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUser('member2@example.com', 'secret');
    expect(result).toBeNull();
  });

  it('blocks team members from authenticating if team member themselves is inactive', async () => {
    partnersServiceMock.findOneByEmail.mockResolvedValue(null);
    agentsServiceMock.findByEmail.mockResolvedValue(null);
    agentsServiceMock.findTeamMemberByEmail.mockResolvedValue({
      id: 'member-3',
      email: 'member3@example.com',
      password: 'hashed',
      is_active: false,
      agent_id: 'agent-ok',
      agent: {
        id: 'agent-ok',
        is_active: true,
        status: 'APPROVED',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUser('member3@example.com', 'secret');
    expect(result).toBeNull();
  });
});
