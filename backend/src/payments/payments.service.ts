import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

type ActiveGateway = 'RAZORPAY' | 'KHALTI';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseEnvironment(configJson: any): 'sandbox' | 'production' {
    const env = String(configJson?.environment || 'sandbox').toLowerCase();
    return env === 'production' ? 'production' : 'sandbox';
  }

  private async withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
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

  private async getLeadOrThrow(leadId: string) {
    const lead = await this.prisma.leads.findUnique({
      where: { id: leadId },
      select: { id: true, name: true, email: true, mobile: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  private async getActiveGatewayConfigOrThrow() {
    const cfgs = await this.prisma.integrationConfig.findMany({
      where: { provider: { in: ['RAZORPAY', 'KHALTI'] as any }, is_active: true },
    });
    if (cfgs.length === 0) throw new BadRequestException('No active payment gateway found');
    const config = cfgs[0];
    return config;
  }

  async getPublicConfig(leadId: string) {
    await this.getLeadOrThrow(leadId);
    const config = await this.getActiveGatewayConfigOrThrow();
    const environment = this.parseEnvironment(config.config_json);
    return {
      provider: config.provider,
      environment,
      display_name: config.display_name,
      is_active: config.is_active,
      key_id: config.provider === 'RAZORPAY' ? config.api_key : undefined,
    };
  }

  private mapKhaltiStatus(status?: string) {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') return 'COMPLETED';
    if (s === 'pending') return 'PENDING';
    if (s === 'initiated') return 'INITIATED';
    if (s === 'expired') return 'EXPIRED';
    if (s.includes('canceled')) return 'CANCELED';
    if (s === 'refunded') return 'REFUNDED';
    return 'FAILED';
  }

  private isFinalStatus(status?: string) {
    return ['COMPLETED', 'FAILED', 'CANCELED', 'EXPIRED', 'REFUNDED'].includes(
      String(status || ''),
    );
  }

  private mapRazorpayPaymentStatus(status?: string) {
    const s = String(status || '').toLowerCase();
    if (s === 'captured' || s === 'authorized') return 'COMPLETED';
    if (s === 'refunded') return 'REFUNDED';
    if (s === 'failed') return 'FAILED';
    if (s === 'created') return 'PENDING';
    return 'PENDING';
  }

  async initiate(leadId: string, dto: InitiatePaymentDto) {
    const lead = await this.getLeadOrThrow(leadId);
    const config = await this.getActiveGatewayConfigOrThrow();

    if (config.provider === 'KHALTI') {
      return this.initiateKhalti(lead, config, dto);
    }
    if (config.provider === 'RAZORPAY') {
      return this.initiateRazorpay(lead, config, dto);
    }
    throw new BadRequestException('Unsupported payment provider');
  }

  private async initiateKhalti(lead: any, config: any, dto: InitiatePaymentDto) {
    const environment = this.parseEnvironment(config.config_json);
    const baseUrl =
      environment === 'production'
        ? 'https://khalti.com/api/v2'
        : 'https://dev.khalti.com/api/v2';
    const returnUrlOverride = config.config_json?.return_url_override;
    const websiteUrl = config.config_json?.website_url || process.env.FRONTEND_PUBLIC_BASE_URL || 'https://idbconnect.global';
    const returnUrl =
      returnUrlOverride ||
      `${websiteUrl.replace(/\/+$/, '')}/pay/${lead.id}`;

    const amountPaisa = Math.round(Number(dto.amount) * 100);
    if (!Number.isFinite(amountPaisa) || amountPaisa < 1000) {
      throw new BadRequestException('Amount should be at least 10');
    }
    const orderRef = `KHALTI-${lead.id}-${Date.now()}`;
    const payload = {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amountPaisa,
      purchase_order_id: orderRef,
      purchase_order_name: dto.description || `Lead Payment ${lead.name}`,
      customer_info: {
        name: lead.name,
        email: lead.email,
        phone: lead.mobile,
      },
    };

    const res = await this.withTimeout(
      fetch(`${baseUrl}/epayment/initiate/`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${config.api_secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new BadRequestException(
        `Khalti initiate failed (${res.status}): ${JSON.stringify(data)}`,
      );
    }

    const tx = await this.prisma.paymentTransaction.create({
      data: {
        lead_id: lead.id,
        gateway: 'KHALTI',
        amount: BigInt(amountPaisa),
        currency: dto.currency || 'NPR',
        order_ref: orderRef,
        pidx: data?.pidx,
        status: 'INITIATED',
        meta: payload as any,
      },
    });

    await this.prisma.timeline.create({
      data: {
        lead_id: lead.id,
        event_type: 'ONLINE_PAYMENT_INITIATED',
        new_state: `KHALTI ${amountPaisa}`,
      },
    });

    return {
      transactionId: tx.id,
      provider: 'KHALTI',
      pidx: data?.pidx,
      payment_url: data?.payment_url,
      status: 'INITIATED',
    };
  }

  private async initiateRazorpay(lead: any, config: any, dto: InitiatePaymentDto) {
    const amountSubunits = Math.round(Number(dto.amount) * 100);
    const orderRef = `RZP-${lead.id}-${Date.now()}`;
    const basic = Buffer.from(`${config.api_key}:${config.api_secret}`).toString('base64');
    const payload = {
      amount: amountSubunits,
      currency: dto.currency || 'INR',
      receipt: orderRef.slice(0, 40),
      notes: {
        lead_id: lead.id,
      },
    };

    const res = await this.withTimeout(
      fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new BadRequestException(
        `Razorpay initiate failed (${res.status}): ${JSON.stringify(data)}`,
      );
    }

    const tx = await this.prisma.paymentTransaction.create({
      data: {
        lead_id: lead.id,
        gateway: 'RAZORPAY',
        amount: BigInt(amountSubunits),
        currency: dto.currency || 'INR',
        order_ref: data?.id || orderRef,
        status: 'INITIATED',
        meta: payload as any,
      },
    });

    await this.prisma.timeline.create({
      data: {
        lead_id: lead.id,
        event_type: 'ONLINE_PAYMENT_INITIATED',
        new_state: `RAZORPAY ${amountSubunits}`,
      },
    });

    return {
      transactionId: tx.id,
      provider: 'RAZORPAY',
      order: data,
      key_id: config.api_key,
      status: 'INITIATED',
    };
  }

  async callback(query: Record<string, any>) {
    const pidx = query?.pidx;
    const rzOrder = query?.razorpay_order_id;
    const rzPayment = query?.razorpay_payment_id;
    if (!pidx && !rzOrder && !rzPayment) {
      throw new BadRequestException('No recognizable callback parameters received');
    }

    const tx = await this.prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          pidx ? { pidx } : undefined,
          rzOrder ? { order_ref: rzOrder } : undefined,
          rzPayment ? { gateway_payment_id: rzPayment } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (!tx) throw new NotFoundException('Payment transaction not found');

    await this.prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { callback_payload: query as any },
    });

    return {
      ok: true,
      transactionId: tx.id,
      provider: tx.gateway,
      status: tx.status,
    };
  }

  async verify(leadId: string, dto: VerifyPaymentDto) {
    await this.getLeadOrThrow(leadId);
    let tx = dto.transactionId
      ? await this.prisma.paymentTransaction.findUnique({ where: { id: dto.transactionId } })
      : await this.prisma.paymentTransaction.findFirst({
          where: {
            lead_id: leadId,
            OR: [
              dto.pidx ? { pidx: dto.pidx } : undefined,
              dto.razorpay_order_id ? { order_ref: dto.razorpay_order_id } : undefined,
            ].filter(Boolean) as any,
          },
          orderBy: { created_at: 'desc' },
        });

    if (!tx) throw new NotFoundException('Payment transaction not found');
    if (tx.lead_id !== leadId) throw new BadRequestException('Transaction does not belong to lead');

    if (this.isFinalStatus(tx.status as string)) {
      return { transactionId: tx.id, status: tx.status, idempotent: true };
    }

    const activeConfig = await this.prisma.integrationConfig.findFirst({
      where: { provider: tx.gateway as ActiveGateway },
    });
    if (!activeConfig) throw new BadRequestException('Gateway config not found');

    if (tx.gateway === 'KHALTI') {
      const verified = await this.verifyKhalti(tx, activeConfig);
      return verified;
    }
    return this.verifyRazorpay(tx, activeConfig, dto);
  }

  async verifyPublic(dto: VerifyPaymentDto) {
    let leadId = dto.leadId;
    if (!leadId && dto.transactionId) {
      const tx = await this.prisma.paymentTransaction.findUnique({
        where: { id: dto.transactionId },
        select: { lead_id: true },
      });
      leadId = tx?.lead_id;
    }
    if (!leadId) {
      throw new BadRequestException('leadId or transactionId is required for verify');
    }
    return this.verify(leadId, dto);
  }

  private async verifyKhalti(tx: any, config: any) {
    if (!tx.pidx) throw new BadRequestException('Khalti transaction missing pidx');
    const environment = this.parseEnvironment(config.config_json);
    const baseUrl =
      environment === 'production'
        ? 'https://khalti.com/api/v2'
        : 'https://dev.khalti.com/api/v2';

    const res = await this.withTimeout(
      fetch(`${baseUrl}/epayment/lookup/`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${config.api_secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: tx.pidx }),
      }),
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new BadRequestException(
        `Khalti verify failed (${res.status}): ${JSON.stringify(data)}`,
      );
    }
    const mapped = this.mapKhaltiStatus(data?.status);
    const updated = await this.prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: {
        status: mapped as any,
        gateway_transaction_id: data?.transaction_id ?? tx.gateway_transaction_id,
        verify_payload: data as any,
      },
    });

    await this.prisma.timeline.create({
      data: {
        lead_id: tx.lead_id,
        event_type:
          mapped === 'COMPLETED'
            ? 'ONLINE_PAYMENT_VERIFIED'
            : mapped === 'CANCELED'
              ? 'ONLINE_PAYMENT_CANCELED'
              : 'ONLINE_PAYMENT_FAILED',
        new_state: `KHALTI ${mapped}`,
      },
    });

    return { transactionId: updated.id, status: updated.status, provider: 'KHALTI' };
  }

  private async verifyRazorpay(tx: any, config: any, dto: VerifyPaymentDto) {
    const orderId = dto.razorpay_order_id || tx.order_ref;
    const paymentId = dto.razorpay_payment_id;
    const signature = dto.razorpay_signature;
    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException(
        'Razorpay verification requires razorpay_order_id, razorpay_payment_id and razorpay_signature',
      );
    }

    const generated = createHmac('sha256', config.api_secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (generated !== signature) {
      throw new BadRequestException('Invalid Razorpay signature');
    }

    const basic = Buffer.from(`${config.api_key}:${config.api_secret}`).toString('base64');
    const res = await this.withTimeout(
      fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: { Authorization: `Basic ${basic}` },
      }),
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new BadRequestException(
        `Razorpay verify failed (${res.status}): ${JSON.stringify(data)}`,
      );
    }
    const mapped = this.mapRazorpayPaymentStatus(data?.status);
    const updated = await this.prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: {
        status: mapped as any,
        gateway_payment_id: paymentId,
        gateway_transaction_id: paymentId,
        verify_payload: data as any,
      },
    });

    await this.prisma.timeline.create({
      data: {
        lead_id: tx.lead_id,
        event_type: mapped === 'COMPLETED' ? 'ONLINE_PAYMENT_VERIFIED' : 'ONLINE_PAYMENT_FAILED',
        new_state: `RAZORPAY ${mapped}`,
      },
    });

    return { transactionId: updated.id, status: updated.status, provider: 'RAZORPAY' };
  }
}
