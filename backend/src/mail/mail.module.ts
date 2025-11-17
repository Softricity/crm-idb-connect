import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';

@Global() // Global so we don't have to import it everywhere
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}