import { baseLayout } from './base';
import { ctaButton, greeting, signOff } from './helpers';

export interface EmailVerificationData {
  user: { firstName: string };
  verifyUrl: string;
  frontendUrl: string;
}

export function renderEmailVerification(data: EmailVerificationData): { subject: string; html: string; text: string } {
  const { user, verifyUrl, frontendUrl } = data;

  const subject = `Overte váš email — Majstr`;

  const html = baseLayout(`
    ${greeting(user.firstName)}
    <p style="font-size:16px;color:#1E293B;font-family:Arial,Helvetica,sans-serif;margin:0 0 16px 0;">
      Ďakujeme za registráciu na <strong style="color:#0D9488;">Majstr</strong>!
      Pre dokončenie registrácie prosím overte vašu emailovú adresu.
    </p>
    <p style="font-size:15px;color:#475569;font-family:Arial,Helvetica,sans-serif;margin:0 0 20px 0;">
      Kliknite na tlačidlo nižšie. Odkaz je platný <strong>24 hodín</strong>.
    </p>
    ${ctaButton('Overiť emailovú adresu', verifyUrl)}
    <p style="font-size:13px;color:#94A3B8;font-family:Arial,Helvetica,sans-serif;margin:16px 0 0 0;text-align:center;">
      Ak ste o registráciu nepožiadali, tento email môžete ignorovať.
    </p>
    ${signOff(frontendUrl)}
  `, `Overte svoju emailovú adresu a začnite používať Majstr`);

  const text = `Dobrý deň, ${user.firstName},

Ďakujeme za registráciu na Majstr!

Pre dokončenie registrácie prosím overte vašu emailovú adresu kliknutím na odkaz nižšie:

${verifyUrl}

Odkaz je platný 24 hodín. Ak ste o registráciu nepožiadali, tento email môžete ignorovať.

S pozdravom,
Tím Majstr`;

  return { subject, html, text };
}
