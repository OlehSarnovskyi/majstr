import { baseLayout } from './base';
import { ctaButton, divider, greeting, signOff } from './helpers';

export interface WelcomeMasterData {
  user: { firstName: string; email: string };
  slug: string;
  frontendUrl: string;
}

export function renderWelcomeMaster(data: WelcomeMasterData): { subject: string; html: string; text: string } {
  const { user, slug, frontendUrl } = data;
  const profileUrl = `${frontendUrl}/masters/${slug}`;
  const dashboardUrl = `${frontendUrl}/dashboard`;

  const subject = `Vitajte na Majster.sk! Váš profil je pripravený`;

  const html = baseLayout(`
    ${greeting(user.firstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 16px 0;">
      Vitajte na <strong style="color:#0D9488;">Majster.sk</strong>! Váš majsterský profil bol úspešne vytvorený.
    </p>
    <p style="font-size:15px;color:#475569;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      Zákazníci vás teraz môžu nájsť a rezervovať vaše služby online. Tu je niekoľko tipov na začiatok:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
      <tr>
        <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 10px 0;font-size:15px;color:#1E293B;">
            <strong style="color:#0D9488;">1.</strong> Pridajte fotku a bio do profilu
          </p>
          <p style="margin:0 0 10px 0;font-size:15px;color:#1E293B;">
            <strong style="color:#0D9488;">2.</strong> Vytvorte si služby so správnymi cenami a trvaním
          </p>
          <p style="margin:0 0 10px 0;font-size:15px;color:#1E293B;">
            <strong style="color:#0D9488;">3.</strong> Nastavte si pracovné hodiny aby zákazníci vedeli kedy ste dostupní
          </p>
          <p style="margin:0;font-size:15px;color:#1E293B;">
            <strong style="color:#0D9488;">4.</strong> Zdieľajte váš profil so zákazníkmi
          </p>
        </td>
      </tr>
    </table>
    ${divider()}
    <p style="font-size:14px;color:#64748B;font-family:Arial,Helvetica,sans-serif;margin:0 0 8px 0;">
      Váš verejný profil:
    </p>
    <p style="font-size:14px;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      <a href="${profileUrl}" style="color:#0D9488;text-decoration:underline;word-break:break-all;">${profileUrl}</a>
    </p>
    ${ctaButton('Otvoriť dashboard', dashboardUrl)}
    ${signOff(frontendUrl)}
  `, `Váš majsterský profil na Majster.sk je aktívny`);

  const text = `Dobrý deň, ${user.firstName},

Vitajte na Majster.sk! Váš majsterský profil bol úspešne vytvorený.

Zákazníci vás teraz môžu nájsť a rezervovať vaše služby online.

Tipy na začiatok:
1. Pridajte fotku a bio do profilu
2. Vytvorte si služby so správnymi cenami a trvaním
3. Nastavte si pracovné hodiny
4. Zdieľajte váš profil so zákazníkmi

Váš verejný profil: ${profileUrl}

Otvoriť dashboard: ${dashboardUrl}

S pozdravom,
Tím Majster.sk`;

  return { subject, html, text };
}
