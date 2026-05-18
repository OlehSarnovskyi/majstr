import { baseLayout } from './base';
import { formatDateSk, ctaButton, infoTable, infoRow, greeting, signOff } from './helpers';

export interface BookingConfirmedClientData {
  booking: {
    id: string;
    startTime: Date | string;
    address: string | null;
    estimatedPrice: number | null;
  };
  service: { name: string };
  master: { firstName: string; lastName: string; phone?: string | null };
  client: { firstName: string };
  frontendUrl: string;
}

export function renderBookingConfirmedClient(data: BookingConfirmedClientData): { subject: string; html: string; text: string } {
  const { booking, service, master, client, frontendUrl } = data;
  const dateStr = formatDateSk(booking.startTime);
  const masterFullName = `${master.firstName} ${master.lastName}`;
  const bookingUrl = `${frontendUrl}/dashboard`;

  const subject = `Vaša rezervácia bola potvrdená — ${service.name}`;

  const rows = [
    infoRow('Služba:', service.name),
    infoRow('Majster:', masterFullName),
    ...(master.phone ? [infoRow('Telefón majstra:', master.phone)] : []),
    infoRow('Dátum a čas:', dateStr),
    ...(booking.address ? [infoRow('Adresa:', booking.address)] : []),
    ...(booking.estimatedPrice != null ? [infoRow('Odhadovaná cena:', `${booking.estimatedPrice} €`)] : []),
  ].join('');

  const html = baseLayout(`
    ${greeting(client.firstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 8px 0;">
      Skvelá správa! Vaša rezervácia bola <strong style="color:#0D9488;">potvrdená</strong>.
    </p>
    <p style="font-size:15px;color:#475569;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      Majster <strong>${masterFullName}</strong> potvrdil vašu rezerváciu. Tu sú detaily:
    </p>
    ${infoTable(rows)}
    ${ctaButton('Zobraziť rezerváciu', bookingUrl)}
    <p style="font-size:14px;color:#64748B;font-family:Arial,Helvetica,sans-serif;margin:16px 0 0 0;">
      V prípade otázok kontaktujte majstra priamo cez telefón alebo cez dashboard.
    </p>
    ${signOff()}
  `, `Rezervácia na ${service.name} bola potvrdená`);

  const text = `Dobrý deň, ${client.firstName},

Skvelá správa! Vaša rezervácia bola potvrdená.

Majster ${masterFullName} potvrdil vašu rezerváciu.

──── DETAILY REZERVÁCIE ────
Služba: ${service.name}
Majster: ${masterFullName}${master.phone ? `\nTelefón majstra: ${master.phone}` : ''}
Dátum a čas: ${dateStr}${booking.address ? `\nAdresa: ${booking.address}` : ''}${booking.estimatedPrice != null ? `\nOdhadovaná cena: ${booking.estimatedPrice} €` : ''}

Zobraziť rezerváciu: ${bookingUrl}

S pozdravom,
Tím Majster.sk`;

  return { subject, html, text };
}
