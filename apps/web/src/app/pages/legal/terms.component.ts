import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container legal">
      <h1>Podmienky používania</h1>
      <p class="legal__updated">Posledná aktualizácia: 1. apríla 2026</p>

      <h2>1. Prevádzkovateľ platformy</h2>
      <p>
        Platformu Majster.sk prevádzkuje:<br/>
        Oleh Sarnovskyi<br/>
        Adresa: Tovarenska 12, 811 09, Bratislava, Slovenská republika<br/>
        Právna forma: Fyzická osoba — nepodnikateľ<br/>
        E-mail: <a href="mailto:oleg.sarnovskiy.98&#64;gmail.com">oleg.sarnovskiy.98&#64;gmail.com</a>
      </p>

      <h2>2. Úvod</h2>
      <p>
        Tieto podmienky upravujú používanie platformy Majster.sk.
        Registráciou alebo používaním platformy súhlasíte s týmito podmienkami.
      </p>

      <h2>3. Registrácia</h2>
      <p>
        Pre používanie platformy je potrebná registrácia s platnou e-mailovou adresou.
        Ste zodpovední za bezpečnosť svojho účtu a hesla.
        Zaväzujete sa uviesť pravdivé a aktuálne informácie.
      </p>

      <h2>4. Pre klientov</h2>
      <p>
        Klienti môžu bezplatne prehliadať služby a vytvárať rezervácie.
        Platba za služby prebieha priamo medzi klientom a majstrom —
        Majster.sk nesprostredkúva platby ani nie je stranou platobnej transakcie.
      </p>

      <h2>5. Pre majstrov</h2>
      <p>Majstri môžu bezplatne pridávať služby a prijímať rezervácie. Majstri sú zodpovední za:</p>
      <ul>
        <li>kvalitu a bezpečnosť poskytovaných služieb</li>
        <li>presnosť uvedených informácií v profile a cenníku</li>
        <li>dodržiavanie platných zákonov SR (živnostenský zákon, daňové predpisy)</li>
        <li>poistenie zodpovednosti za škodu (odporúčané)</li>
      </ul>

      <h2>6. Charakter platformy a obmedzenie zodpovednosti</h2>
      <p>
        Majster.sk je výlučne sprostredkovateľská platforma, ktorá spája klientov
        s nezávislými poskytovateľmi služieb (majstrami).
        Majster.sk nie je zmluvnou stranou dohody medzi klientom a majstrom.
      </p>
      <p>Majster.sk nenesie zodpovednosť za:</p>
      <ul>
        <li>kvalitu, bezpečnosť ani výsledok poskytnutých služieb</li>
        <li>škody na majetku alebo zdraví vzniknuté v súvislosti s poskytnutými službami</li>
        <li>pravdivosť informácií uvedených majstrami v ich profiloch</li>
        <li>nedodržanie termínov alebo zrušenie rezervácií zo strany majstra alebo klienta</li>
        <li>spory medzi klientmi a majstrami</li>
        <li>výpadky platformy spôsobené treťou stranou (hosting, internet)</li>
      </ul>
      <p>
        Majstri sú nezávislými podnikateľmi (živnostníkmi alebo s.r.o.),
        nie zamestnancami ani zástupcami platformy Majster.sk.
      </p>

      <h2>7. Zrušenie rezervácií</h2>
      <p>
        Klient aj majster môžu zrušiť rezerváciu prostredníctvom platformy.
        Podmienky storna a prípadná kompenzácia sú vecou dohody medzi klientom a majstrom —
        Majster.sk do tohto vzťahu nevstupuje.
      </p>

      <h2>8. Hodnotenia a recenzie</h2>
      <p>
        Klienti môžu hodnotiť majstrov po dokončení rezervácie.
        Hodnotenia musia byť pravdivé a nesmú obsahovať urážlivý obsah.
        Majster.sk si vyhradzuje právo odstrániť hodnotenia porušujúce tieto zásady.
      </p>

      <h2>9. Zrušenie účtu</h2>
      <p>
        Účet môžete kedykoľvek zrušiť na stránke nastavení alebo e-mailom na
        <a href="mailto:oleg.sarnovskiy.98&#64;gmail.com">oleg.sarnovskiy.98&#64;gmail.com</a>.
        Po zrušení budú vaše údaje vymazané v súlade so
        <a routerLink="/privacy">Zásadami ochrany súkromia</a>.
      </p>
      <p>Majster.sk si vyhradzuje právo zablokovať alebo zrušiť účet, ktorý porušuje tieto podmienky.</p>

      <h2>10. Duševné vlastníctvo</h2>
      <p>
        Platforma Majster.sk, jej dizajn, kód a obsah sú duševným vlastníctvom prevádzkovateľa.
        Obsah platformy nesmie byť kopírovaný, distribuovaný ani upravovaný bez písomného súhlasu.
      </p>

      <h2>11. Zmeny podmienok</h2>
      <p>
        Majster.sk si vyhradzuje právo kedykoľvek zmeniť tieto podmienky.
        O podstatných zmenách vás budeme informovať e-mailom aspoň 14 dní pred nadobudnutím účinnosti zmien.
        Pokračovaním v používaní platformy po nadobudnutí účinnosti zmien
        vyjadrujete súhlas s novými podmienkami.
      </p>

      <h2>12. Rozhodné právo a príslušný súd</h2>
      <p>
        Tieto podmienky sa riadia právnym poriadkom Slovenskej republiky.
        Na riešenie sporov je príslušný všeobecný súd podľa sídla prevádzkovateľa.
      </p>

      <h2>13. Kontakt</h2>
      <p>
        Pre otázky týkajúce sa týchto podmienok nás kontaktujte na
        <a href="mailto:oleg.sarnovskiy.98&#64;gmail.com">oleg.sarnovskiy.98&#64;gmail.com</a>.
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
  `],
})
export class TermsComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.setPage('Podmienky používania');
  }
}
