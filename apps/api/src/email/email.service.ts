import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

interface BookingEmailData {
  service: { name: string };
  client: { firstName: string; email: string };
  master: { firstName: string; email: string };
  startTime: Date;
  status?: string;
}

/** Format a booking date in Slovak locale, always in Bratislava timezone (UTC+1/+2). */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString('sk-SK', {
    timeZone: 'Europe/Bratislava',
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: BrevoClient | null = null;
  private readonly senderEmail: string;
  private readonly senderName = 'Majster.sk';

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@majster.sk';

    if (apiKey) {
      this.client = new BrevoClient({ apiKey });
      this.logger.log(`✅ Brevo configured | sender=${this.senderEmail}`);
    } else {
      this.logger.warn(
        'Brevo not configured — emails will only be logged to console. Set BREVO_API_KEY env var.'
      );
    }
  }

  async sendNewBookingNotification(booking: BookingEmailData) {
    const dateStr = formatDate(booking.startTime);

    await this.sendMail(
      booking.master.email,
      `Nová rezervácia: ${booking.service.name}`,
      `Dobrý deň ${booking.master.firstName},\n\nMáte novú rezerváciu od ${booking.client.firstName} na službu "${booking.service.name}" dňa ${dateStr}.\n\nProsím prihláste sa a potvrďte alebo zamietnte rezerváciu.\n\nMajster.sk`
    );

    await this.sendMail(
      booking.client.email,
      `Rezervácia prijatá: ${booking.service.name}`,
      `Dobrý deň ${booking.client.firstName},\n\nVaša rezervácia na službu "${booking.service.name}" u majstra ${booking.master.firstName} dňa ${dateStr} bola odoslaná a čaká na potvrdenie.\n\nMajster.sk`
    );
  }

  async sendBookingStatusUpdate(booking: BookingEmailData) {
    const statusMap: Record<string, string> = {
      CONFIRMED: 'potvrdená',
      CANCELLED: 'zrušená',
      COMPLETED: 'dokončená',
    };
    const statusText = statusMap[booking.status ?? ''] ?? booking.status;
    const isCancelled = booking.status === 'CANCELLED';
    const dateStr = formatDate(booking.startTime);
    const body = isCancelled
      ? `Dobrý deň ${booking.client.firstName},\n\nVaša rezervácia na službu "${booking.service.name}" dňa ${dateStr} bola zrušená.\n\nMajster.sk`
      : `Dobrý deň ${booking.client.firstName},\n\nVaša rezervácia na službu "${booking.service.name}" dňa ${dateStr} bola ${statusText} majstrom ${booking.master.firstName}.\n\nMajster.sk`;

    await this.sendMail(
      booking.client.email,
      `Rezervácia ${statusText}: ${booking.service.name}`,
      body
    );
  }

  async sendPasswordResetEmail(to: string, firstName: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
    await this.sendMail(
      to,
      'Obnovenie hesla — Majster.sk',
      `Dobrý deň ${firstName},\n\nPožiadali ste o obnovenie hesla. Kliknite na odkaz nižšie pre nastavenie nového hesla:\n\n${resetUrl}\n\nOdkaz je platný 1 hodinu. Ak ste o obnovenie nepožiadali, ignorujte tento email.\n\nMajster.sk`
    );
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    await this.sendMail(
      to,
      'Vitajte na Majster.sk! 🎉',
      `Dobrý deň ${firstName},\n\nVitajte na Majster.sk!\n\nVáš účet bol úspešne vytvorený cez Google. Môžete sa kedykoľvek prihlásiť pomocou tlačidla "Prihlásiť sa cez Google".\n\nČo môžete robiť:\n• Prehliadať majstrov a ich služby\n• Rezervovať termíny online\n• Sledovať stav vašich rezervácií\n\nZačnite hľadať: ${frontendUrl}/services\n\nMajster.sk — majster na všetky ruky`
    );
  }

  async sendTestEmail(to: string) {
    await this.sendMail(
      to,
      '✅ Test email — Majster.sk Brevo works!',
      `Tento email bol odoslaný z produkčného servera Majster.sk.\n\nBrevo konfigurácia funguje správne!\n\nČas odoslania: ${new Date().toISOString()}\n\nMajster.sk`
    );
  }

  async sendEmailVerification(to: string, firstName: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;
    await this.sendMail(
      to,
      'Overte váš email — Majster.sk',
      `Dobrý deň ${firstName},\n\nProsím overte vašu emailovú adresu kliknutím na odkaz nižšie:\n\n${verifyUrl}\n\nMajster.sk`
    );
  }

  private async sendMail(to: string, subject: string, text: string) {
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
      });
      this.logger.log(`✅ Email sent to ${to}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to send email to ${to}: ${msg}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
