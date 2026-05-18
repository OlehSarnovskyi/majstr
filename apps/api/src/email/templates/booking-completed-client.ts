import { baseLayout } from './base';
import { formatDateSk, ctaButton, infoTable, infoRow, greeting, signOff } from './helpers';

export interface BookingCompletedClientData {
  booking: {
    id: string;
    startTime: Date | string;
  };
  service: { name: string };
  master: { firstName: string; lastName: string };
  client: { firstName: string };
  frontendUrl: string;
}

export function renderBookingCompletedClient(data: BookingCompletedClientData): { subject: string; html: string; text: string } {
  const { booking, service, master, client, frontendUrl } = data;
  const dateStr = formatDateSk(booking.startTime);
  const masterFullName = `${master.firstName} ${master.lastName}`;
  const reviewUrl = `${frontendUrl}/dashboard?tab=bookings&bookingId=${booking.id}&action=review`;

  const subject = `Ako bola vaša skúsenosť s ${master.firstName}?`;

  const rows = [
    infoRow('Služba:', service.name),
    infoRow('Majster:', masterFullName),
    infoRow('Dátum:', dateStr),
  ].join('');

  const html = baseLayout(`
    ${greeting(client.firstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 8px 0;">
      Vaša rezervácia na službu <strong>${service.name}</strong> bola dokončená. Dúfame, že ste boli spokojní!
    </p>
    <p style="font-size:15px;color:#475569;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      Zanechajte hodnotenie pre majstra <strong>${masterFullName}</strong> — pomôže to ďalším zákazníkom nájsť toho správneho odborníka.
    </p>
    ${infoTable(rows)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;background-color:#FFFBEB;border-radius:8px;border:1px solid #FDE68A;">
      <tr>
        <td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 8px 0;font-size:22px;text-align:center;white-space:nowrap;letter-spacing:2px;">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
          <p style="margin:0;font-size:14px;color:#92400E;text-align:center;">Vaše hodnotenie nám veľmi pomáha. Stačí kliknúť nižšie!</p>
        </td>
      </tr>
    </table>
    ${ctaButton('Ohodnotiť majstra', reviewUrl)}
    ${signOff(frontendUrl)}
  `, `Ako hodnotíte majstra ${masterFullName}? Zanechajte recenziu`);

  const text = `Dobrý deň, ${client.firstName},

Vaša rezervácia na službu ${service.name} bola dokončená.

Zanechajte hodnotenie pre majstra ${masterFullName} — pomôže to ďalším zákazníkom nájsť toho správneho odborníka.

──── DETAILY ────
Služba: ${service.name}
Majster: ${masterFullName}
Dátum: ${dateStr}

Ohodnotiť majstra: ${reviewUrl}

S pozdravom,
Tím Majster.sk`;

  return { subject, html, text };
}
