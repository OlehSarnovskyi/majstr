import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { EmailService } from '../email/email.service';

const SAMPLE_BOOKING = {
  id: 'test-booking-id',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
  address: 'Bratislava, Hlavná 1',
  note: 'Prosím zavolajte pred príchodom',
  estimatedPrice: 150,
};

const SAMPLE_MASTER = { firstName: 'Ján', lastName: 'Novák', email: '', phone: '+421 900 123 456' };
const SAMPLE_CLIENT = { firstName: 'Peter', lastName: 'Kováč', email: '', phone: '+421 911 999 888' };
const SAMPLE_SERVICE = { name: 'Oprava elektrickej inštalácie' };

@Controller('dev')
export class DevController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test-email')
  async testEmail(@Body() body: { type: string; email: string }) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new ForbiddenException('Not available in production');
    }

    const { type, email } = body;
    const master = { ...SAMPLE_MASTER, email };
    const client = { ...SAMPLE_CLIENT, email };

    switch (type) {
      case 'new-booking-master':
        await this.emailService.sendNewBookingToMaster({
          booking: SAMPLE_BOOKING,
          service: SAMPLE_SERVICE,
          client,
          master,
        });
        break;

      case 'booking-confirmed-client':
        await this.emailService.sendBookingConfirmedToClient({
          booking: SAMPLE_BOOKING,
          service: SAMPLE_SERVICE,
          master,
          client,
        });
        break;

      case 'booking-cancelled-by-master':
        await this.emailService.sendBookingCancelled({
          booking: { id: SAMPLE_BOOKING.id, startTime: SAMPLE_BOOKING.startTime },
          service: SAMPLE_SERVICE,
          master,
          client,
          cancelledBy: 'master',
        });
        break;

      case 'booking-cancelled-by-client':
        await this.emailService.sendBookingCancelled({
          booking: { id: SAMPLE_BOOKING.id, startTime: SAMPLE_BOOKING.startTime },
          service: SAMPLE_SERVICE,
          master,
          client,
          cancelledBy: 'client',
        });
        break;

      case 'booking-completed-client':
        await this.emailService.sendBookingCompletedToClient({
          booking: { id: SAMPLE_BOOKING.id, startTime: SAMPLE_BOOKING.startTime },
          service: SAMPLE_SERVICE,
          master,
          client,
        });
        break;

      case 'welcome-master':
        await this.emailService.sendWelcomeMaster({
          user: { firstName: master.firstName, email },
          slug: 'jan-novak',
        });
        break;

      case 'welcome-client':
        await this.emailService.sendWelcomeClient({
          user: { firstName: client.firstName, email },
        });
        break;

      case 'welcome':
        await this.emailService.sendWelcomeEmail(email, 'Test User');
        break;

      case 'test':
      default:
        await this.emailService.sendTestEmail(email);
        break;
    }

    return { message: `Email type "${type}" sent to ${email}` };
  }
}
