import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  template: `
    <div class="container legal">
      <h1>Podmienky používania</h1>
      <p class="legal__updated">Posledná aktualizácia: 1. apríla 2026</p>

      <h2>1. Úvod</h2>
      <p>Tieto podmienky upravujú používanie platformy Majster.sk. Registráciou súhlasíte s týmito podmienkami.</p>

      <h2>2. Registrácia</h2>
      <p>Pre používanie platformy je potrebná registrácia s platnou e-mailovou adresou. Ste zodpovední za bezpečnosť svojho účtu a hesla.</p>

      <h2>3. Pre klientov</h2>
      <p>Klienti môžu bezplatne prehliadať služby a vytvárať rezervácie. Platba za služby prebieha priamo medzi klientom a majstrom — Majster.sk nesprostredkúva platby.</p>

      <h2>4. Pre majstrov</h2>
      <p>Majstri môžu bezplatne pridávať služby a prijímať rezervácie. Majstri sú zodpovední za kvalitu poskytovaných služieb a presnosť uvedených informácií.</p>

      <h2>5. Zodpovednosť</h2>
      <p>Majster.sk je výlučne sprostredkovateľská platforma, ktorá spája klientov s nezávislými poskytovateľmi služieb (majstrami). Majster.sk nie je zmluvnou stranou dohody medzi klientom a majstrom.</p>
      <p>Nenesieme zodpovednosť za: kvalitu, bezpečnosť ani výsledok poskytnutých služieb; škody na majetku alebo zdraví vzniknuté v súvislosti s poskytnutými službami; pravdivosť informácií uvedených majstrami v ich profiloch; nedodržanie termínov alebo zrušenie rezervácií zo strany majstra.</p>
      <p>Majstri sú nezávislými podnikateľmi, nie zamestnancami ani zástupcami platformy Majster.sk.</p>

      <h2>6. Zrušenie účtu</h2>
      <p>Účet môžete kedykoľvek zrušiť. Po zrušení budú vaše údaje vymazané v súlade so Zásadami ochrany súkromia.</p>

      <h2>7. Kontakt</h2>
      <p>E-mail: oleg.sarnovskiy.98&#64;gmail.com</p>
    </div>
  `,
  styles: [`
    .legal {
      padding-top: 48px; padding-bottom: 80px;
      max-width: 720px;

      h1 { font-size: 2rem; margin-bottom: 8px; }
      h2 { font-size: 1.25rem; margin-top: 32px; margin-bottom: 8px; }
      p { color: var(--color-text-light); line-height: 1.7; margin-bottom: 12px; }

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
