import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private siteName = 'Majstr';

  private title = inject(Title);
  private meta = inject(Meta);

  setPage(pageTitle: string, description?: string) {
    this.title.setTitle(
      pageTitle ? `${pageTitle} | ${this.siteName}` : `${this.siteName} — Nájdite a rezervujte majstrov`
    );
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
    }
    this.meta.updateTag({ property: 'og:title', content: pageTitle || this.siteName });
  }
}
