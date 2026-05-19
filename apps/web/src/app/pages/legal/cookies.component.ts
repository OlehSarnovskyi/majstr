import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-cookies',
  standalone: true,
  template: `
    <div class="container legal">
      <h1>Zásady používania cookies</h1>
      <p class="legal__updated">Posledná aktualizácia: 1. apríla 2026</p>

      <h2>1. Čo sú cookies?</h2>
      <p>
        Cookies sú malé textové súbory, ktoré sa ukladajú vo vašom prehliadači pri návšteve webovej stránky.
        Pomáhajú stránke zapamätať si vaše nastavenia a zabezpečiť správne fungovanie.
      </p>

      <h2>2. Aké cookies používame</h2>

      <h3>2.1 Nevyhnutné cookies</h3>
      <p>Tieto cookies sú potrebné na základné fungovanie stránky. Bez nich by stránka nefungovala správne.</p>
      <p>
        <strong>Poznámka:</strong> Naša platforma využíva
        <strong>localStorage</strong> prehliadača (nie cookies)
        na uloženie autentifikačného tokenu. LocalStorage nie je
        cookie, ale plní podobnú funkciu — uchováva váš prihlasovací stav.
        Tieto údaje sa vzdialene nezdieľajú a zostávajú len vo vašom prehliadači.
      </p>
      <table>
        <thead>
          <tr><th>Názov</th><th>Účel</th><th>Platnosť</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>accessToken</td>
            <td>
              JWT autentifikačný token uložený v <strong>localStorage</strong>
              (nie cookie). Používa sa na overenie identity prihláseného používateľa.
            </td>
            <td>24 hodín</td>
          </tr>
          <tr>
            <td>refreshToken</td>
            <td>
              Token na obnovenie prihlásenia (ak je implementovaný),
              uložený v <strong>localStorage</strong>.
            </td>
            <td>7 dní (ak je implementovaný)</td>
          </tr>
          <tr><td>cookie_consent</td><td>Uloženie vášho rozhodnutia o cookies</td><td>Trvalé</td></tr>
        </tbody>
      </table>

      <h3>2.2 Funkčné cookies</h3>
      <p>Tieto cookies zlepšujú funkčnosť stránky, napríklad načítanie písiem.</p>
      <table>
        <thead>
          <tr><th>Poskytovateľ</th><th>Účel</th><th>Typ</th></tr>
        </thead>
        <tbody>
          <tr><td>Google Fonts</td><td>Načítanie písma Inter a Material Icons</td><td>Tretia strana</td></tr>
        </tbody>
      </table>

      <h3>2.3 Autentifikačné cookies</h3>
      <p>Ak sa prihlasujete cez Google, môžu sa nastaviť ďalšie cookies od spoločnosti Google na účely overenia identity.</p>

      <h2>3. Správa cookies</h2>
      <p>
        Pri prvej návšteve stránky si môžete vybrať, či prijmete všetky cookies alebo iba nevyhnutné.
        Svoje rozhodnutie môžete kedykoľvek zmeniť vymazaním cookies vo vašom prehliadači.
      </p>
      <p>Nastavenia cookies nájdete v prehliadači:</p>
      <ul>
        <li><strong>Chrome:</strong> Nastavenia → Súkromie a bezpečnosť → Cookies</li>
        <li><strong>Firefox:</strong> Nastavenia → Súkromie a bezpečnosť → Cookies</li>
        <li><strong>Safari:</strong> Predvoľby → Súkromie → Cookies</li>
        <li><strong>Edge:</strong> Nastavenia → Cookies a povolenia stránok</li>
      </ul>

      <h2>4. Kontakt</h2>
      <p>
        Ak máte otázky ohľadom cookies, kontaktujte nás na
        <a href="mailto:oleg.sarnovskiy.98&#64;gmail.com">oleg.sarnovskiy.98&#64;gmail.com</a>.
      </p>
    </div>
  `,
  styles: [`
    .legal {
      padding-top: 48px; padding-bottom: 60px;
      max-width: 720px;

      h1 { font-size: 2rem; margin-bottom: 4px; }
      h2 { margin-top: 32px; margin-bottom: 12px; font-size: 1.25rem; }
      h3 { margin-top: 20px; margin-bottom: 8px; font-size: 1.063rem; }
      p, li { line-height: 1.7; color: var(--color-text-light); font-size: 0.938rem; }
      ul { padding-left: 24px; margin: 8px 0; }
      a { color: var(--color-primary); }
    }

    .legal__updated {
      color: var(--color-text-muted);
      font-size: 0.813rem !important;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 0.875rem;

      th, td {
        text-align: left;
        padding: 10px 12px;
        border: 1px solid var(--color-border);
      }

      th {
        background: var(--color-bg-secondary, #F9FAFB);
        font-weight: 600;
        color: var(--color-text);
      }

      td { color: var(--color-text-light); }
    }
  `],
})
export class CookiesComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.setPage('Zásady používania cookies');
  }
}
