import { baseLayout } from './base';
import { ctaButton, greeting, signOff, divider } from './helpers';

export interface WelcomeClientData {
  user: { firstName: string };
  frontendUrl: string;
}

/** One feature row: icon cell + text cell, inline-safe for all email clients. */
function featureRow(icon: string, text: string): string {
  return `
  <tr>
    <td style="width:32px;vertical-align:top;padding:6px 8px 6px 0;font-size:18px;line-height:1;">${icon}</td>
    <td style="vertical-align:top;padding:6px 0;font-size:15px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">${text}</td>
  </tr>`;
}

export function renderWelcomeClient(data: WelcomeClientData): { subject: string; html: string; text: string } {
  const { user, frontendUrl } = data;
  const mastersUrl   = `${frontendUrl}/masters`;
  const categoriesUrl = `${frontendUrl}/categories`;

  const subject = `Vitajte na Majstr! 🎉`;

  const html = baseLayout(`
    ${greeting(user.firstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      Váš účet bol úspešne vytvorený. Tu je prehľad toho, čo môžete na <strong style="color:#0D9488;">Majstr</strong> robiť:
    </p>

    <!-- As a client -->
    <p style="font-size:13px;font-weight:700;color:#0D9488;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">Ako klient</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px 0;">
      ${featureRow('🔍', 'Prehliadajte overených remeselníkov podľa kategórie a mesta')}
      ${featureRow('📅', 'Rezervujte termíny online, kedykoľvek a odkiaľkoľvek')}
      ${featureRow('⭐', 'Hodnoťte majstrov a pomáhajte ostatným zákazníkom nájsť toho správneho')}
    </table>

    ${divider()}

    <!-- As a master -->
    <p style="font-size:13px;font-weight:700;color:#0D9488;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px 0;">Ako majster</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
      ${featureRow('🛠️', 'Pridajte vaše služby s popisom, cenou a dĺžkou trvania')}
      ${featureRow('📲', 'Prijímajte rezervácie a spravujte ich cez prehľadný dashboard')}
      ${featureRow('💬', 'Zdieľajte odkaz na váš profil cez WhatsApp, SMS alebo Facebook')}
    </table>

    ${ctaButton('Začať prehľadávať Majstr', mastersUrl)}
    ${signOff(frontendUrl)}
  `, `Vítame vás na Majstr — nájdite alebo ponúknite remeselné služby na Slovensku`);

  const text = `Dobrý deň, ${user.firstName},

Váš účet bol úspešne vytvorený na Majstr.

AKO KLIENT:
- Prehliadajte overených remeselníkov podľa kategórie a mesta
- Rezervujte termíny online, kedykoľvek a odkiaľkoľvek
- Hodnoťte majstrov a pomáhajte ostatným zákazníkom

AKO MAJSTER:
- Pridajte vaše služby s popisom, cenou a dĺžkou trvania
- Prijímajte rezervácie a spravujte ich cez dashboard
- Zdieľajte odkaz na profil cez WhatsApp, SMS alebo Facebook

Začať prehľadávať: ${mastersUrl}
Všetky kategórie: ${categoriesUrl}

S pozdravom,
Tím Majstr`;

  return { subject, html, text };
}
