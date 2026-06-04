import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Public } from '../auth/public.decorator';

@Controller('payments/public')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get(':leadId/config')
  getConfig(@Param('leadId') leadId: string) {
    return this.paymentsService.getPublicConfig(leadId);
  }

  @Public()
  @Post(':leadId/initiate')
  initiate(@Param('leadId') leadId: string, @Body() body: InitiatePaymentDto) {
    return this.paymentsService.initiate(leadId, body);
  }

  @Public()
  @Get('callback')
  callback(@Query() query: Record<string, any>) {
    return this.paymentsService.callback(query);
  }

  @Public()
  @Post(':leadId/verify')
  verify(@Param('leadId') leadId: string, @Body() body: VerifyPaymentDto) {
    return this.paymentsService.verify(leadId, body);
  }

  @Public()
  @Post('verify')
  verifyPublic(@Body() body: VerifyPaymentDto) {
    return this.paymentsService.verifyPublic(body);
  }
}
