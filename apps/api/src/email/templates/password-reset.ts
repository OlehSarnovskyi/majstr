import { baseLayout } from './base';
import { greeting, ctaButton, signOff } from './helpers';

export function renderPasswordReset(params: {
  firstName: string;
  resetUrl: string;
}): string {
  const { firstName, resetUrl } = params;

  const content = `
${greeting(firstName)}

<p style="font-size:15px;color:#334155;font-family:Arial,Helvetica,sans-serif;margin:0 0 24px 0;">
  Požiadali ste o obnovenie hesla k vášmu účtu Majstr.<br/>
  Kliknite na tlačidlo nižšie a nastavte si nové heslo:
</p>

${ctaButton('Nastaviť nové heslo', resetUrl)}

<p style="font-size:13px;color:#94A3B8;font-family:Arial,Helvetica,sans-serif;margin:16px 0 0 0;text-align:center;">
  Odkaz je platný <strong>1 hodinu</strong>.
</p>

<p style="font-size:13px;color:#94A3B8;font-family:Arial,Helvetica,sans-serif;margin:16px 0 0 0;">
  Ak ste o obnovenie hesla nepožiadali, tento email jednoducho ignorujte &mdash; váš účet zostane v bezpečí.
</p>

${signOff()}`;

  return baseLayout(content, 'Obnovte si heslo k vášmu účtu Majstr.');
}
