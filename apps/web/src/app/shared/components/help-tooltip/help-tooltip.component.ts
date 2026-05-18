import { Component, Input, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-tooltip.component.html',
  styleUrl: './help-tooltip.component.scss',
})
export class HelpTooltipComponent {
  @Input() text = '';
  visible = signal(false);

  toggle() { this.visible.update(v => !v); }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('app-help-tooltip')) {
      this.visible.set(false);
    }
  }
}
