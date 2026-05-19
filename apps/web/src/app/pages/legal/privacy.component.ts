import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container legal">
      <h1>Zásady ochrany súkromia</h1>
      <p class="legal__updated">Posledná aktualizácia: 1. apríla 2026</p>

      <h2>1. Prevádzkovateľ</h2>
      <p>
        Prevádzkovateľom osobných údajov je:<br/>
        Oleh Sarnovskyi<br/>
        Adresa: Tovarenska 12, 811 09, Bratislava, Slovenská republika<br/>
        Právna forma: Fyzická osoba — nepodnikateľ<br/>
        E-mail: <a href="mailto:oleg.sarnovskiy.98&#64;gmail.com">oleg.sarnovskiy.98&#64;gmail.com</a>
      </p>

      <h2>2. Aké údaje zhromažďujeme</h2>
      <p>Pri registrácii zhromažďujeme:</p>
      <ul>
        <li>Meno a priezvisko</li>
        <li>E-mailovú adresu</li>
        <li>Telefónne číslo (voliteľne)</li>
        <li>Mesto pôsobenia (pre majstrov)</li>
      </ul>
      <p>Pri používaní platformy zhromažďujeme:</p>
      <ul>
        <li>Údaje o rezerváciách (dátum, čas, adresa, poznámky)</li>
        <li>Hodnotenia a komentáre</li>
        <li>Technické údaje (IP adresa, typ prehliadača) na účely bezpečnosti</li>
      </ul>

      <h2>3. Právny základ spracovania (čl. 6 GDPR)</h2>
      <ul>
        <li>Poskytovanie služieb platformy a spracovanie rezervácií — <strong>výkon zmluvy</strong> (čl. 6 ods. 1 písm. b GDPR)</li>
        <li>E-mailové notifikácie o rezerváciách — <strong>výkon zmluvy</strong> (čl. 6 ods. 1 písm. b GDPR)</li>
        <li>Bezpečnosť a ochrana platformy — <strong>oprávnený záujem</strong> prevádzkovateľa (čl. 6 ods. 1 písm. f GDPR)</li>
        <li>Zlepšovanie služieb a analytika — <strong>oprávnený záujem</strong> prevádzkovateľa (čl. 6 ods. 1 písm. f GDPR)</li>
      </ul>

      <h2>4. Príjemcovia údajov a tretie strany</h2>
      <p>Na prevádzku platformy využívame nasledujúcich spracovateľov, ktorí môžu mať prístup k vašim osobným údajom:</p>
      <table>
        <thead>
          <tr>
            <th>Poskytovateľ</th>
            <th>Účel</th>
            <th>Sídlo</th>
            <th>Ochrana údajov</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel Inc.</td>
            <td>Hosting webovej aplikácie</td>
            <td>USA</td>
            <td>Standard Contractual Clauses (SCC)</td>
          </tr>
          <tr>
            <td>Neon Inc.</td>
            <td>Databáza (uloženie údajov)</td>
            <td>USA</td>
            <td>Standard Contractual Clauses (SCC)</td>
          </tr>
          <tr>
            <td>Northflank Ltd.</td>
            <td>Hosting API servera</td>
            <td>UK/EÚ</td>
            <td>GDPR compliant</td>
          </tr>
          <tr>
            <td>Brevo (Sendinblue)</td>
            <td>Odosielanie e-mailov</td>
            <td>Francúzsko (EÚ)</td>
            <td>GDPR compliant</td>
          </tr>
          <tr>
            <td>Google LLC</td>
            <td>Prihlásenie cez Google (OAuth)</td>
            <td>USA</td>
            <td>Standard Contractual Clauses (SCC)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Pri prenose údajov do USA je právnym základom uzavretie Štandardných zmluvných doložiek
        (Standard Contractual Clauses) v súlade s čl. 46 GDPR.
      </p>
      <p>Vaše údaje nepredávame žiadnym tretím stranám na reklamné účely.</p>

      <h2>5. Zdieľanie údajov medzi používateľmi</h2>
      <p>
        V rámci potvrdených rezervácií zdieľame kontaktné údaje (meno, e-mail, telefón)
        medzi klientom a majstrom, a to výlučne na účely plnenia rezervácie.
      </p>

      <h2>6. Uchovávanie údajov</h2>
      <p>
        Vaše údaje uchovávame po dobu existencie vášho účtu.
        Po vymazaní účtu budú vaše osobné údaje odstránené do 30 dní,
        s výnimkou údajov, ktoré sme povinní uchovávať zo zákona.
      </p>

      <h2>7. Vaše práva (GDPR)</h2>
      <p>Podľa GDPR máte právo na:</p>
      <ul>
        <li>Prístup k svojim osobným údajom (čl. 15)</li>
        <li>Opravu nesprávnych údajov (čl. 16)</li>
        <li>Vymazanie údajov — "právo byť zabudnutý" (čl. 17)</li>
        <li>Obmedzenie spracovania (čl. 18)</li>
        <li>Prenosnosť údajov (čl. 20)</li>
        <li>Námietku proti spracovaniu (čl. 21)</li>
      </ul>
      <p>
        Pre uplatnenie svojich práv nás kontaktujte na
        <a href="mailto:oleg.sarnovskiy.98&#64;gmail.com">oleg.sarnovskiy.98&#64;gmail.com</a>.
        Na vašu žiadosť odpovieme do 30 dní.
      </p>
      <p>
        Máte tiež právo podať sťažnosť na
        <strong>Úrad na ochranu osobných údajov Slovenskej republiky</strong>:
        <a href="https://www.dataprotection.gov.sk" target="_blank" rel="noopener noreferrer">www.dataprotection.gov.sk</a>
      </p>

      <h2>8. Cookies a lokálne úložisko</h2>
      <p>
        Podrobné informácie o cookies a lokálnom úložisku nájdete v našich
        <a routerLink="/cookies">Zásadách používania cookies</a>.
      </p>

      <h2>9. Zmeny zásad</h2>
      <p>
        Tieto zásady môžeme aktualizovať. O podstatných zmenách vás budeme informovať
        e-mailom aspoň 14 dní vopred. Dátum poslednej aktualizácie je uvedený v záhlaví dokumentu.
      </p>
    </div>
  `,
  styles: [`
    .legal {
      padding-top: 48px; padding-bottom: 80px;
      max-width: 720px;

      h1 { font-size: 2rem; margin-bottom: 8px; }
      h2 { font-size: 1.25rem; margin-top: 32px; margin-bottom: 8px; }
      p { color: var(--color-text-light); line-height: 1.7; margin-bottom: 12px; }
      ul { padding-left: 24px; margin: 8px 0 16px; }
      li { color: var(--color-text-light); line-height: 1.7; margin-bottom: 4px; }
      a { color: var(--color-primary); }

      &__updated {
        font-size: 0.875rem;
        color: var(--color-text-muted);
        margin-bottom: 32px;
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px;
      font-size: 0.875rem;

      th, td {
        text-align: left;
        padding: 10px 12px;
        border: 1px solid var(--color-border);
      }

      th {
        background: #F9FAFB;
        font-weight: 600;
        color: var(--color-text);
      }

      td { color: var(--color-text-light); }
    }
  `],
})
export class PrivacyComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.setPage('Ochrana súkromia');
  }
}
