import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  private readonly paymentProviders = ['RAZORPAY', 'KHALTI'] as const;

  private isPaymentProvider(provider?: string): provider is 'RAZORPAY' | 'KHALTI' {
    return !!provider && this.paymentProviders.includes(provider as any);
  }

  private parseEnvironment(configJson: any): 'sandbox' | 'production' {
    const env = String(configJson?.environment || 'sandbox').toLowerCase();
    return env === 'production' ? 'production' : 'sandbox';
  }

  private async withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
    let timeout: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('timeout')), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private async validateRazorpayCredentials(apiKey?: string, apiSecret?: string) {
    if (!apiKey || !apiSecret) {
      throw new BadRequestException('Razorpay key id and key secret are required');
    }

    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    try {
      const res = await this.withTimeout(
        fetch('https://api.razorpay.com/v1/orders?count=1', {
          method: 'GET',
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (res.ok) return;
      const body = await res.text();
      if (res.status === 401 || res.status === 400) {
        throw new BadRequestException(
          `Invalid Razorpay credentials (${res.status}): ${body || 'authentication failed'}`,
        );
      }
      throw new BadRequestException(
        `Razorpay credential validation failed (${res.status}): ${body || 'unexpected response'}`,
      );
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      if (error?.message === 'timeout') {
        throw new BadRequestException('Razorpay credential validation timed out');
      }
      throw new BadRequestException(
        `Razorpay credential validation failed due to network/server error: ${error?.message || 'unknown error'}`,
      );
    }
  }

  private async validateKhaltiCredentials(apiSecret?: string, configJson?: any) {
    if (!apiSecret) {
      throw new BadRequestException('Khalti secret key is required');
    }
    const environment = this.parseEnvironment(configJson);
    const baseUrl =
      environment === 'production'
        ? 'https://khalti.com/api/v2'
        : 'https://dev.khalti.com/api/v2';

    try {
      // Use lookup with dummy pidx. 401 means invalid credentials; validation error means auth passed.
      const res = await this.withTimeout(
        fetch(`${baseUrl}/epayment/lookup/`, {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pidx: 'PING_TEST_PIDX' }),
        }),
      );

      if (res.status === 401) {
        const body = await res.text();
        throw new BadRequestException(
          `Invalid Khalti credentials (401): ${body || 'authentication failed'}`,
        );
      }

      if (res.ok || res.status === 400 || res.status === 404) return;
      const body = await res.text();
      throw new BadRequestException(
        `Khalti credential validation failed (${res.status}): ${body || 'unexpected response'}`,
      );
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      if (error?.message === 'timeout') {
        throw new BadRequestException('Khalti credential validation timed out');
      }
      throw new BadRequestException(
        `Khalti credential validation failed due to network/server error: ${error?.message || 'unknown error'}`,
      );
    }
  }

  private async validateProviderCredentials(provider: string, data: { api_key?: string; api_secret?: string; config_json?: any; is_active?: boolean }) {
    if (!this.isPaymentProvider(provider)) return;
    if (data.is_active === false) return;

    if (provider === 'RAZORPAY') {
      await this.validateRazorpayCredentials(data.api_key, data.api_secret);
      return;
    }
    await this.validateKhaltiCredentials(data.api_secret, data.config_json);
  }

  private normalizeConfig(provider: string, configJson: any) {
    if (!this.isPaymentProvider(provider)) return configJson ?? {};
    const base = typeof configJson === 'object' && configJson ? configJson : {};
    return {
      ...base,
      environment: this.parseEnvironment(base),
    };
  }

  async findAll() {
    return this.prisma.integrationConfig.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findByProvider(provider: string) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { provider: provider as any },
    });
    return config;
  }

  async upsert(dto: CreateIntegrationDto) {
    const { provider, ...data } = dto;
    const updateData: any = {
      ...data,
      config_json: this.normalizeConfig(provider, data.config_json),
    };

    await this.validateProviderCredentials(provider, updateData);

    return this.prisma.$transaction(async (tx) => {
      if (this.isPaymentProvider(provider) && updateData.is_active === true) {
        await tx.integrationConfig.updateMany({
          where: {
            provider: { in: this.paymentProviders.filter((p) => p !== provider) as any },
          },
          data: { is_active: false },
        });
        updateData.connected_at = new Date();
      }

      return tx.integrationConfig.upsert({
        where: { provider: provider as any },
        create: {
          provider: provider as any,
          ...updateData,
        },
        update: updateData,
      });
    });
  }

  async update(id: string, dto: UpdateIntegrationDto) {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    const provider = config.provider as string;
    const updateData: any = {
      ...dto,
      config_json: dto.config_json === undefined ? config.config_json : this.normalizeConfig(provider, dto.config_json),
    };
    const anyDto = dto as any;
    if (anyDto.is_active === true && !config.is_active) {
      updateData.connected_at = new Date();
    }
    await this.validateProviderCredentials(provider, {
      api_key: updateData.api_key ?? config.api_key ?? undefined,
      api_secret: updateData.api_secret ?? config.api_secret ?? undefined,
      config_json: updateData.config_json ?? config.config_json ?? {},
      is_active: updateData.is_active ?? config.is_active,
    });

    return this.prisma.$transaction(async (tx) => {
      if (this.isPaymentProvider(provider) && updateData.is_active === true) {
        await tx.integrationConfig.updateMany({
          where: {
            provider: { in: this.paymentProviders.filter((p) => p !== provider) as any },
          },
          data: { is_active: false },
        });
      }

      return tx.integrationConfig.update({
        where: { id },
        data: updateData,
      });
    });
  }

  async remove(id: string) {
    return this.prisma.integrationConfig.delete({
      where: { id },
    });
  }
}
