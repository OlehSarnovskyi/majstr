/**
 * Shared helpers for email templates.
 * Uses built-in Intl for Slovak date formatting (no date-fns dependency).
 */

/** Format a date in Slovak locale, in Bratislava timezone. */
export function formatDateSk(date: Date | string): string {
  const d = new Date(date);
  // Full day name, day, month name, year, time
  return d.toLocaleString('sk-SK', {
    timeZone: 'Europe/Bratislava',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Table-based CTA button for email compatibility. */
export function ctaButton(label: string, url: string, color = '#0D9488'): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;">
  <tr>
    <td class="cta-td" style="border-radius:6px;background-color:${color};">
      <a href="${url}" class="cta-button" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;border-radius:6px;font-family:Arial,Helvetica,sans-serif;background-color:${color};">${label}</a>
    </td>
  </tr>
</table>`;
}

/** Horizontal rule separator. */
export function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />`;
}

/**
 * A label: value info row inside a details table.
 * Wrap multiple infoRow() calls in infoTable() for proper styling.
 */
export function infoRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:6px 12px;color:#64748B;font-size:14px;width:40%;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">${label}</td>
    <td style="padding:6px 12px;color:#1E293B;font-size:14px;font-weight:500;font-family:Arial,Helvetica,sans-serif;">${value}</td>
  </tr>`;
}

/** Wraps infoRow() calls in a styled table container. */
export function infoTable(rows: string): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;border-radius:8px;margin:16px 0;border:1px solid #E2E8F0;">
  ${rows}
</table>`;
}

/** Greeting paragraph. */
export function greeting(firstName: string): string {
  return `<p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 16px 0;">Dobrý deň, <strong>${firstName}</strong>,</p>`;
}

/** Sign-off block. */
export function signOff(frontendUrl = 'https://majstr.app'): string {
  return `
${divider()}
<p style="font-size:14px;color:#64748B;font-family:Arial,Helvetica,sans-serif;margin:16px 0 0 0;">
  S pozdravom,<br/>
  <a href="${frontendUrl}" style="color:#0D9488;text-decoration:none;font-weight:700;">Tím Majstr</a>
</p>`;
}
