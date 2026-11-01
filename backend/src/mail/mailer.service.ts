import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface InviteEmail {
  to: string;
  personName: string;
  acceptUrl: string;
  expiresAt: Date;
}

export interface ResetEmail {
  to: string;
  resetUrl: string;
  expiresAt: Date;
}

// Sends the account emails. Driver is picked at startup:
//  - SMTP_HOST/SMTP_USER/SMTP_PASS set  -> real mail via SMTP (e.g. Gmail app password)
//  - otherwise                          -> console driver, links logged for hand-copying
// To move to a transactional API provider later (Resend, Brevo, ...), either
// keep SMTP if the provider offers it (most do) or swap these two methods.
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  // Undefined when no SMTP config is present, which selects the console driver
  private readonly transporter: nodemailer.Transporter | undefined;
  private readonly from: string;

  constructor() {
    const host = process.env['SMTP_HOST'];
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASS'];

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env['SMTP_PORT'] || 587),
        secure: Number(process.env['SMTP_PORT'] || 587) === 465,
        auth: { user, pass },
      });
      this.from = process.env['MAIL_FROM'] || user;
      this.logger.log(`SMTP mail driver active (${host}, sending as ${this.from})`);
    } else {
      this.from = process.env['MAIL_FROM'] || 'no-reply@localhost';
      this.logger.log('No SMTP config found — emails will be logged to the console only');
    }
  }

  async sendInviteEmail(email: InviteEmail): Promise<void> {
    const subject = 'Create your tennis account';
    const body = [
      `Hi ${email.personName},`,
      '',
      'You have been invited to create an account for the tennis competition platform.',
      'Open the link below before it expires to choose your password:',
      '',
      email.acceptUrl,
      '',
      `This link expires at ${email.expiresAt.toISOString()}.`,
      'If you were not expecting this email, you can ignore it.',
    ].join('\n');

    await this.deliver(email.to, subject, body);
  }

  async sendResetEmail(email: ResetEmail): Promise<void> {
    const subject = 'Reset your tennis account password';
    const body = [
      'Hi,',
      '',
      'A password reset was requested for your account.',
      'Open the link below before it expires to choose a new password:',
      '',
      email.resetUrl,
      '',
      `This link expires at ${email.expiresAt.toISOString()}.`,
      'If you did not request this, you can ignore this email and your password stays unchanged.',
    ].join('\n');

    await this.deliver(email.to, subject, body);
  }

  // One path for both drivers so the two email templates above stay provider-agnostic
  private async deliver(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        [
          `--- EMAIL (console driver, not really sent) ---`,
          `To:      ${to}`,
          `Subject: ${subject}`,
          text,
          `-----------------------------------------------`,
        ].join('\n'),
      );
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      // SMTP failures (bad credentials, quota, ...) must not leave the admin
      // thinking the invite went out — surface the error loudly.
      this.logger.error(`Failed to send email to ${to}: ${err}`);
      throw err;
    }
  }
}
