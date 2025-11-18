// src/offline-payments/offline-payments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { OfflinePaymentsService } from './offline-payments.service';
import { CreateOfflinePaymentDto } from './dto/create-offline-payment.dto';
import { UpdateOfflinePaymentDto } from './dto/update-offline-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class OfflinePaymentsController {
  constructor(private readonly offlinePaymentsService: OfflinePaymentsService) {}

  @Post('offline-payments')
  create(@Body() createDto: CreateOfflinePaymentDto, @Request() req) {
    return this.offlinePaymentsService.create(createDto, req.user.userId);
  }

  @Get('leads/:leadId/offline-payments')
  findByLeadId(@Param('leadId') leadId: string) {
    return this.offlinePaymentsService.findByLeadId(leadId);
  }

  @Get('partners/:receiverId/offline-payments')
  findByReceiver(@Param('receiverId') receiverId: string) {
    return this.offlinePaymentsService.findByReceiver(receiverId);
  }

  @Patch('offline-payments/:id')
  update(@Param('id') id: string, @Body() updateDto: UpdateOfflinePaymentDto) {
    return this.offlinePaymentsService.update(id, updateDto);
  }

  @Delete('offline-payments/:id')
  delete(@Param('id') id: string, @Request() req) {
    return this.offlinePaymentsService.delete(id, req.user.userId);
  }
}
