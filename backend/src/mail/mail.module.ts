import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';

import { MailController } from './mail.controller';

@Global() // Global so we don't have to import it everywhere
@Module({
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}