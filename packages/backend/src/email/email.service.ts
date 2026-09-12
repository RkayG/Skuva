import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    // Initialize Resend. In development, if no key is provided, we'll just log the email.
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY is missing. Emails will only be logged.');
    }
  }

  async sendInviteEmail(to: string, organizationName: string, inviteUrl: string) {
    const subject = `You've been invited to join ${organizationName} on Skuva`;
    const html = `
      <h1>Welcome to Skuva!</h1>
      <p>You have been invited to join <strong>${organizationName}</strong>.</p>
      <p>Click the link below to create your account and accept the invite:</p>
      <a href="${inviteUrl}">${inviteUrl}</a>
    `;

    if (!this.resend) {
      this.logger.log(`[Email Mock] To: ${to} | Subject: ${subject} | Link: ${inviteUrl}`);
      return true;
    }

    try {
      await this.resend.emails.send({
        from: 'Skuva <noreply@skuva.com>',
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${to}`, error);
      throw error;
    }
  }
}
