import { Global, Module } from '@nestjs/common';
import { MailerService } from './mailer.service.js';

// Global so any module can email without importing MailModule everywhere.
@Global()
@Module({
  providers: [MailerService],
  exports: [MailerService],
})
export class MailModule {}
