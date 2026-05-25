import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { renderNewBookingMaster } from './templates/new-booking-master';
import { renderBookingConfirmedClient } from './templates/booking-confirmed-client';
import { renderBookingCancelled } from './templates/booking-cancelled';
import { renderBookingCompletedClient } from './templates/booking-completed-client';
import { renderWelcomeMaster } from './templates/welcome-master';
import { renderWelcomeClient } from './templates/welcome-client';
import { renderEmailVerification } from './templates/email-verification';
import { renderPasswordReset } from './templates/password-reset';

const FRONTEND_URL = process.env['FRONTEND_URL'] || 'https://majstr.app';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: BrevoClient | null = null;
  private readonly senderEmail: string;
  private readonly senderName = 'Majstr';

  constructor() {
    const apiKey = process.env['BREVO_API_KEY'];
    this.senderEmail = process.env['BREVO_SENDER_EMAIL'] || 'noreply@majstr.app';

    if (apiKey) {
      this.client = new BrevoClient({ apiKey });
      this.logger.log(`✅ Brevo configured | sender=${this.senderEmail}`);
    } else {
      this.logger.warn(
        'Brevo not configured — emails will only be logged to console. Set BREVO_API_KEY env var.'
      );
    }
  }

  // ─── New booking methods ────────────────────────────────────────────────────

  async sendNewBookingToMaster(data: {
    booking: {
      id: string;
      startTime: Date | string;
      address: string | null;
      note: string | null;
      estimatedPrice: number | null;
    };
    service: { name: string };
    client: { firstName: string; lastName: string; email: string; phone?: string | null };
    master: { firstName: string; email: string };
  }): Promise<void> {
    const { subject, html, text } = renderNewBookingMaster({
      ...data,
      frontendUrl: FRONTEND_URL,
    });
    await this.sendMail(data.master.email, subject, text, html);
  }

  async sendBookingConfirmedToClient(data: {
    booking: {
      id: string;
      startTime: Date | string;
      address: string | null;
      estimatedPrice: number | null;
    };
    service: { name: string };
    master: { firstName: string; lastName: string; phone?: string | null };
    client: { firstName: string; email: string };
  }): Promise<void> {
    const { subject, html, text } = renderBookingConfirmedClient({
      ...data,
      frontendUrl: FRONTEND_URL,
    });
    await this.sendMail(data.client.email, subject, text, html);
  }

  async sendBookingCancelled(data: {
    booking: { id: string; startTime: Date | string };
    service: { name: string };
    master: { firstName: string; lastName: string; email: string };
    client: { firstName: string; lastName: string; email: string };
    cancelledBy: 'master' | 'client';
  }): Promise<void> {
    const { booking, service, master, client, cancelledBy } = data;

    // Determine recipient: send to the OTHER party
    if (cancelledBy === 'master') {
      // Master cancelled → notify client
      const { subject, html, text } = renderBookingCancelled({
        booking, service, master, client,
        cancelledBy,
        recipient: 'client',
        frontendUrl: FRONTEND_URL,
      });
      await this.sendMail(client.email, subject, text, html);
    } else {
      // Client cancelled → notify master
      const { subject, html, text } = renderBookingCancelled({
        booking, service, master, client,
        cancelledBy,
        recipient: 'master',
        frontendUrl: FRONTEND_URL,
      });
      await this.sendMail(master.email, subject, text, html);
    }
  }

  async sendBookingCompletedToClient(data: {
    booking: { id: string; startTime: Date | string };
    service: { name: string };
    master: { firstName: string; lastName: string };
    client: { firstName: string; email: string };
  }): Promise<void> {
    const { subject, html, text } = renderBookingCompletedClient({
      ...data,
      frontendUrl: FRONTEND_URL,
    });
    await this.sendMail(data.client.email, subject, text, html);
  }

  async sendWelcomeMaster(data: {
    user: { firstName: string; email: string };
    slug: string;
  }): Promise<void> {
    const { subject, html, text } = renderWelcomeMaster({
      ...data,
      frontendUrl: FRONTEND_URL,
    });
    await this.sendMail(data.user.email, subject, text, html);
  }

  async sendWelcomeClient(data: {
    user: { firstName: string; email: string };
  }): Promise<void> {
    const { subject, html, text } = renderWelcomeClient({
      user: data.user,
      frontendUrl: FRONTEND_URL,
    });
    await this.sendMail(data.user.email, subject, text, html);
  }

  // ─── Legacy / existing methods ─────────────────────────────────────────────

  async sendPasswordResetEmail(to: string, firstName: string, token: string) {
    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
    const html = renderPasswordReset({ firstName, resetUrl });
    await this.sendMail(to, 'Obnovenie hesla — Majstr', '', html);
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    await this.sendMail(
      to,
      'Vitajte na Majstr! 🎉',
      `Dobrý deň ${firstName},\n\nVitajte na Majstr!\n\nVáš účet bol úspešne vytvorený cez Google. Môžete sa kedykoľvek prihlásiť pomocou tlačidla "Prihlásiť sa cez Google".\n\nČo môžete robiť:\n• Prehliadať majstrov a ich služby\n• Rezervovať termíny online\n• Sledovať stav vašich rezervácií\n\nZačnite hľadať: ${frontendUrl}/services\n\nMajstr`
    );
  }

  async sendTestEmail(to: string) {
    await this.sendMail(
      to,
      '✅ Test email — Majstr Brevo works!',
      `Tento email bol odoslaný z produkčného servera Majstr.\n\nBrevo konfigurácia funguje správne!\n\nČas odoslania: ${new Date().toISOString()}\n\nMajstr`
    );
  }

  async sendEmailVerification(to: string, firstName: string, token: string) {
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;
    const { subject, html, text } = renderEmailVerification({
      user: { firstName },
      verifyUrl,
      frontendUrl,
    });
    await this.sendMail(to, subject, text, html);
  }

  // ─── Core send ─────────────────────────────────────────────────────────────

  private async sendMail(to: string, subject: string, text: string, html?: string) {
    if (!this.client) {
      this.logger.log(`[DEV - no Brevo] Email to ${to} | Subject: ${subject}`);
      this.logger.debug(text);
      return;
    }

    this.logger.log(`Sending email to ${to} | Subject: ${subject}`);

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: to }],
        subject,
        textContent: text,
        ...(html ? { htmlContent: html } : {}),
      });
      this.logger.log(`✅ Email sent to ${to}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `❌ Failed to send email to ${to}: ${msg}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }
}
