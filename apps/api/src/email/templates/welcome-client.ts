import { baseLayout } from './base';
import { ctaButton, greeting, signOff } from './helpers';

export interface WelcomeClientData {
  user: { firstName: string };
  frontendUrl: string;
}

export function renderWelcomeClient(data: WelcomeClientData): { subject: string; html: string; text: string } {
  const { user, frontendUrl } = data;
  const servicesUrl = `${frontendUrl}/services`;

  const subject = `Vitajte na Majstr! 🎉`;

  const html = baseLayout(`
    ${greeting(user.firstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 16px 0;">
      Vitajte na <strong style="color:#0D9488;">Majstr</strong>! Váš účet bol úspešne vytvorený.
    </p>
    <p style="font-size:15px;color:#475569;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      Na Majstr môžete rýchlo a jednoducho nájsť a rezervovať overených remeselníkov vo vašom okolí.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 10px 0;font-size:15px;color:#1E293B;">
            <strong style="color:#0D9488;">&#128269;</strong>&nbsp; Prehliadajte majstrov podľa kategórie a mesta
          </p>
          <p style="margin:0 0 10px 0;font-size:15px;color:#1E293B;">
            <strong style="color:#0D9488;">&#128197;</strong>&nbsp; Rezervujte termíny online, kedykoľvek a odkiaľkoľvek
          </p>
          <p style="margin:0;font-size:15px;color:#1E293B;">
            <strong style="color:#0D9488;">&#11088;</strong>&nbsp; Hodnoťte majstrov a pomáhajte ostatným zákazníkom
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton('Začať hľadať majstra', servicesUrl)}
    ${signOff(frontendUrl)}
  `, `Začnite hľadať skvelých remeselníkov na Majstr`);

  const text = `Dobrý deň, ${user.firstName},

Vitajte na Majstr! Váš účet bol úspešne vytvorený.

Na Majstr môžete rýchlo a jednoducho nájsť a rezervovať overených remeselníkov vo vašom okolí.

Čo môžete robiť:
- Prehliadajte majstrov podľa kategórie a mesta
- Rezervujte termíny online, kedykoľvek a odkiaľkoľvek
- Hodnoťte majstrov a pomáhajte ostatným zákazníkom

Začať hľadať majstra: ${servicesUrl}

S pozdravom,
Tím Majstr`;

  return { subject, html, text };
}
