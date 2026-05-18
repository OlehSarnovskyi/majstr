import { baseLayout } from './base';
import { formatDateSk, ctaButton, infoTable, infoRow, greeting, signOff } from './helpers';

export interface BookingCancelledData {
  booking: {
    id: string;
    startTime: Date | string;
  };
  service: { name: string };
  master: { firstName: string; lastName: string };
  client: { firstName: string; lastName: string };
  cancelledBy: 'master' | 'client';
  recipient: 'master' | 'client';
  frontendUrl: string;
}

export function renderBookingCancelled(data: BookingCancelledData): { subject: string; html: string; text: string } {
  const { booking, service, master, client, cancelledBy, recipient, frontendUrl } = data;
  const dateStr = formatDateSk(booking.startTime);
  const masterFullName = `${master.firstName} ${master.lastName}`;
  const clientFullName = `${client.firstName} ${client.lastName}`;
  const bookingUrl = `${frontendUrl}/dashboard`;

  const subject = `Rezervácia bola zrušená — ${service.name}`;

  const rows = [
    infoRow('Služba:', service.name),
    infoRow('Majster:', masterFullName),
    infoRow('Klient:', clientFullName),
    infoRow('Dátum a čas:', dateStr),
  ].join('');

  let recipientFirstName: string;
  let mainMessage: string;
  let plainMessage: string;

  if (recipient === 'master') {
    // Master receives this — client cancelled
    recipientFirstName = master.firstName;
    mainMessage = `Klient <strong>${clientFullName}</strong> zrušil rezerváciu na službu <strong>${service.name}</strong>.`;
    plainMessage = `Klient ${clientFullName} zrušil rezerváciu na službu ${service.name}.`;
  } else {
    // Client receives this
    if (cancelledBy === 'master') {
      recipientFirstName = client.firstName;
      mainMessage = `Ľutujeme, majster <strong>${masterFullName}</strong> zrušil vašu rezerváciu na službu <strong>${service.name}</strong>. Môžete si rezervovať nový termín.`;
      plainMessage = `Ľutujeme, majster ${masterFullName} zrušil vašu rezerváciu na službu ${service.name}. Môžete si rezervovať nový termín.`;
    } else {
      // Client cancelled their own booking — confirmation to them
      recipientFirstName = client.firstName;
      mainMessage = `Vaša rezervácia na službu <strong>${service.name}</strong> bola úspešne zrušená.`;
      plainMessage = `Vaša rezervácia na službu ${service.name} bola úspešne zrušená.`;
    }
  }

  const html = baseLayout(`
    ${greeting(recipientFirstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      ${mainMessage}
    </p>
    ${infoTable(rows)}
    ${recipient === 'client' && cancelledBy === 'master' ? ctaButton('Vyhľadať iného majstra', `${frontendUrl}/services`) : ctaButton('Zobraziť rezervácie', bookingUrl)}
    ${signOff()}
  `, `Rezervácia na ${service.name} bola zrušená`);

  const ctaText = recipient === 'client' && cancelledBy === 'master'
    ? `Vyhľadať iného majstra: ${frontendUrl}/services`
    : `Zobraziť rezervácie: ${bookingUrl}`;

  const text = `Dobrý deň, ${recipientFirstName},

${plainMessage}

──── DETAILY REZERVÁCIE ────
Služba: ${service.name}
Majster: ${masterFullName}
Klient: ${clientFullName}
Dátum a čas: ${dateStr}

${ctaText}

S pozdravom,
Tím Majster.sk`;

  return { subject, html, text };
}
