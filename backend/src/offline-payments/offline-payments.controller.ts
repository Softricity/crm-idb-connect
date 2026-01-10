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
  UseInterceptors, // Import
  UploadedFile,    // Import
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // Import
import { OfflinePaymentsService } from './offline-payments.service';
import { CreateOfflinePaymentDto } from './dto/create-offline-payment.dto';
import { UpdateOfflinePaymentDto } from './dto/update-offline-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class OfflinePaymentsController {
  constructor(private readonly offlinePaymentsService: OfflinePaymentsService) {}

  @Post('offline-payments')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createDto: CreateOfflinePaymentDto, 
    @Request() req,
    @UploadedFile() file: Express.Multer.File
  ) {
    // Pass req.user (which contains full user details) as the last argument
    return this.offlinePaymentsService.create(createDto, req.user.userId, file, req.user);
  }

  // Upload-only endpoint: accepts a file and returns the public URL without creating a DB record
  @Post('offline-payments/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileOnly(@UploadedFile() file: Express.Multer.File, @Body('lead_id') leadId: string) {
    return this.offlinePaymentsService.uploadFileOnly(file, leadId);
  }

  // Delete uploaded file by URL (no DB record) - expects JSON { fileUrl }
  @Post('offline-payments/delete-file')
  async deleteUploadedFile(@Body('fileUrl') fileUrl: string) {
    return this.offlinePaymentsService.deleteFileOnly(fileUrl);
  }

  @Get('leads/:leadId/offline-payments')
  findByLeadId(@Param('leadId') leadId: string, @Request() req) {
    return this.offlinePaymentsService.findByLeadId(leadId, req.user);
  }

  @Get('partners/:receiverId/offline-payments')
  findByReceiver(@Param('receiverId') receiverId: string, @Request() req) {
    return this.offlinePaymentsService.findByReceiver(receiverId, req.user);
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