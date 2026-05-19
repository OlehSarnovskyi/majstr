import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <div class="container legal">
      <h1>Zásady ochrany súkromia</h1>
      <p class="legal__updated">Posledná aktualizácia: 1. apríla 2026</p>

      <h2>1. Aké údaje zhromažďujeme</h2>
      <p>Pri registrácii zhromažďujeme vaše meno, priezvisko, e-mailovú adresu a voliteľne telefónne číslo. Pri používaní platformy môžeme zhromažďovať údaje o vašich rezerváciách a službách.</p>

      <h2>2. Ako používame vaše údaje</h2>
      <p>Vaše údaje používame na: poskytovanie služieb platformy, spracovanie rezervácií, komunikáciu s vami (e-mailové notifikácie o rezerváciách), zlepšovanie našich služieb.</p>

      <h2>3. Zdieľanie údajov</h2>
      <p>Vaše kontaktné údaje zdieľame len s majstrami/klientmi v rámci potvrdených rezervácií. Vaše údaje nepredávame tretím stranám.</p>

      <h2>4. Uchovávanie údajov</h2>
      <p>Vaše údaje uchovávame po dobu existencie vášho účtu. Po vymazaní účtu budú vaše osobné údaje odstránené do 30 dní.</p>

      <h2>5. Vaše práva (GDPR)</h2>
      <p>Máte právo na: prístup k svojim údajom, opravu údajov, vymazanie účtu, prenosnosť údajov, obmedzenie spracovania. Pre uplatnenie svojich práv nás kontaktujte na oleg.sarnovskiy.98&#64;gmail.com.</p>

      <h2>6. Cookies</h2>
      <p>Používame len nevyhnutné technické cookies (autentifikačný token) potrebné pre fungovanie platformy. Nepoužívame sledovacie ani reklamné cookies.</p>

      <h2>7. Kontakt</h2>
      <p>Prevádzkovateľ: Majster.sk<br/>E-mail: oleg.sarnovskiy.98&#64;gmail.com</p>
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
export class PrivacyComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.setPage('Ochrana súkromia');
  }
}
