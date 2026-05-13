import { Component, input, output, signal } from '@angular/core';

/**
 * Reusable star-rating widget.
 *
 * Read-only mode (no output listener needed):
 *   <app-star-rating [value]="4.5" />
 *
 * Interactive mode (for review forms):
 *   <app-star-rating [value]="rating" (valueChange)="rating = $event" [interactive]="true" />
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <span class="stars" [class.stars--interactive]="interactive()">
      @for (star of [1,2,3,4,5]; track star) {
        <button
          type="button"
          class="star"
          [class.star--filled]="star <= (hovered() ?? value())"
          [class.star--half]="!interactive() && star - 0.5 === value()"
          [attr.aria-label]="star + ' hviezdičiek'"
          [disabled]="!interactive()"
          (mouseenter)="interactive() && hovered.set(star)"
          (mouseleave)="interactive() && hovered.set(null)"
          (click)="interactive() && onSelect(star)"
        >★</button>
      }
    </span>
  `,
  styles: [`
    .stars {
      display: inline-flex;
      gap: 2px;
      line-height: 1;
    }
    .star {
      background: none;
      border: none;
      padding: 0;
      font-size: 1.25rem;
      color: #d1d5db;
      cursor: default;
      transition: color 0.1s;
    }
    .star--filled { color: #f59e0b; }
    .stars--interactive .star { cursor: pointer; }
    .stars--interactive .star:focus-visible {
      outline: 2px solid var(--color-primary);
      border-radius: 2px;
    }
    button[disabled] { pointer-events: none; }
  `],
})
export class StarRatingComponent {
  value    = input<number>(0);
  interactive = input<boolean>(false);
  valueChange = output<number>();

  hovered = signal<number | null>(null);

  onSelect(star: number) {
    this.valueChange.emit(star);
  }
}
