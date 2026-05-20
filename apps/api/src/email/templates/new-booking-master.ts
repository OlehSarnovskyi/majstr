import { baseLayout } from './base';
import { formatDateSk, ctaButton, infoTable, infoRow, greeting, signOff } from './helpers';

export interface NewBookingMasterData {
  booking: {
    id: string;
    startTime: Date | string;
    address: string | null;
    note: string | null;
    estimatedPrice: number | null;
  };
  service: { name: string };
  client: { firstName: string; lastName: string; email: string; phone?: string | null };
  master: { firstName: string };
  frontendUrl: string;
}

export function renderNewBookingMaster(data: NewBookingMasterData): { subject: string; html: string; text: string } {
  const { booking, service, client, master, frontendUrl } = data;
  const dateStr = formatDateSk(booking.startTime);
  const clientFullName = `${client.firstName} ${client.lastName}`;
  const bookingUrl = `${frontendUrl}/dashboard`;

  const subject = `Nová rezervácia od ${client.firstName} — ${service.name}`;

  const rows = [
    infoRow('Služba:', service.name),
    infoRow('Klient:', clientFullName),
    infoRow('Email klienta:', client.email),
    ...(client.phone ? [infoRow('Telefón klienta:', client.phone)] : []),
    infoRow('Dátum a čas:', dateStr),
    ...(booking.address ? [infoRow('Adresa:', booking.address)] : []),
    ...(booking.estimatedPrice != null ? [infoRow('Odhadovaná cena:', `${booking.estimatedPrice} €`)] : []),
    ...(booking.note ? [infoRow('Poznámka:', booking.note)] : []),
  ].join('');

  const html = baseLayout(`
    ${greeting(master.firstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      Máte novú rezerváciu od klienta <strong>${clientFullName}</strong>. Prosím, potvrďte alebo zamietajte rezerváciu čo najskôr.
    </p>
    ${infoTable(rows)}
    ${ctaButton('Zobraziť rezerváciu', bookingUrl)}
    ${signOff(frontendUrl)}
  `, `Nová rezervácia od ${clientFullName} na ${service.name}`);

  const text = `Dobrý deň, ${master.firstName},

Máte novú rezerváciu od klienta ${clientFullName}.

──── DETAILY REZERVÁCIE ────
Služba: ${service.name}
Klient: ${clientFullName}
Email klienta: ${client.email}${client.phone ? `\nTelefón klienta: ${client.phone}` : ''}
Dátum a čas: ${dateStr}${booking.address ? `\nAdresa: ${booking.address}` : ''}${booking.estimatedPrice != null ? `\nOdhadovaná cena: ${booking.estimatedPrice} €` : ''}${booking.note ? `\nPoznámka: ${booking.note}` : ''}

Zobraziť rezerváciu: ${bookingUrl}

S pozdravom,
Tím Majstr`;

  return { subject, html, text };
}
