/**
 * Base HTML email layout for Majster.sk
 * Table-based for maximum email client compatibility.
 */
export function baseLayout(content: string, preheader?: string): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="sk" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Majster.sk</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F1F5F9; font-family: Arial, Helvetica, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    a { color: #0D9488; text-decoration: none; }
    .wrapper { background-color: #F1F5F9; padding: 32px 16px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { background-color: #0D9488; padding: 24px 32px; text-align: center; }
    .header-title { color: #FFFFFF; font-size: 22px; font-weight: bold; margin: 0; font-family: Arial, Helvetica, sans-serif; }
    .body { padding: 32px; }
    .footer { background-color: #F8FAFC; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer-text { color: #94A3B8; font-size: 12px; line-height: 1.6; margin: 0; }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 8px !important; }
      .body { padding: 16px !important; }
      .header { padding: 20px 16px !important; }
      .footer { padding: 16px !important; }
      .cta-button { width: 100% !important; display: block !important; text-align: center !important; }
      .cta-td { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body>
  ${preheaderHtml}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="wrapper" style="background-color:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="container" style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td class="header" style="background-color:#0D9488;padding:24px 32px;text-align:center;">
              <p class="header-title" style="color:#FFFFFF;font-size:22px;font-weight:bold;margin:0;font-family:Arial,Helvetica,sans-serif;">&#128295; Majster.sk</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="body" style="padding:32px;background-color:#FFFFFF;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer" style="background-color:#F8FAFC;padding:20px 32px;text-align:center;border-top:1px solid #E2E8F0;">
              <p class="footer-text" style="color:#94A3B8;font-size:12px;line-height:1.6;margin:0;">
                Majster.sk &mdash; platforma pre slovenských remeselníkov<br/>
                <span style="font-size:11px;">Ak si neželáte dostávať tieto emaily, odporúčame vám spravovať nastavenia vo vašom profile.</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
