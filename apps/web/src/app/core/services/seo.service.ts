import { Injectable, inject, DOCUMENT } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';

const BASE_URL = 'https://majstr.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private siteName = 'Majstr';

  private title    = inject(Title);
  private meta     = inject(Meta);
  private document = inject(DOCUMENT);
  private router   = inject(Router);

  /**
   * Call on every page init.
   * @param pageTitle  – displayed after siteName in <title>. Pass '' for homepage.
   * @param description – used for <meta description> and og:description.
   * @param path        – explicit path for canonical/og:url (e.g. '/masters/jan-novak').
   *                      Falls back to current router URL.
   */
  setPage(pageTitle: string, description?: string, path?: string) {
    // ── <title> ────────────────────────────────────────────────────────────────
    this.title.setTitle(
      pageTitle
        ? `${pageTitle} | ${this.siteName}`
        : `${this.siteName} — Nájdite a rezervujte majstrov`
    );

    // ── Description ────────────────────────────────────────────────────────────
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
    }

    // ── Open Graph ─────────────────────────────────────────────────────────────
    const canonicalPath = path ?? this.router.url.split('?')[0];
    const canonicalUrl  = `${BASE_URL}${canonicalPath}`;

    this.meta.updateTag({ property: 'og:title',  content: pageTitle || this.siteName });
    this.meta.updateTag({ property: 'og:url',    content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image',  content: DEFAULT_IMAGE });
    this.meta.updateTag({ property: 'og:image:width',  content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });

    // ── <link rel="canonical"> ─────────────────────────────────────────────────
    this.setCanonical(canonicalUrl);

    // ── Clear previous page's JSON-LD ──────────────────────────────────────────
    this.removeJsonLd();
  }

  /** Inject a JSON-LD <script> block into <head>. Call after setPage(). */
  setJsonLd(schema: object): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id   = '__json-ld__';
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private removeJsonLd(): void {
    this.document.getElementById('__json-ld__')?.remove();
  }
}
