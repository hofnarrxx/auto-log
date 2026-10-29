import { Component, HostBinding, HostListener, Input } from '@angular/core';

/** The tip that is currently open, so opening another one closes it. */
let openTip: WarningTip | null = null;

/**
 * A small warning triangle that reveals an explanatory message: on hover for pointer devices and
 * on tap/click for touch devices. Clicks are swallowed so the tip can sit inside a clickable
 * parent (e.g. a timeline row) without triggering it.
 */
@Component({
  selector: 'app-warning-tip',
  template: `
    <span class="trigger" role="img" [attr.aria-label]="text">▲</span>
    <span class="bubble" role="tooltip">{{ text }}</span>
  `,
  styleUrl: './warning-tip.css',
})
export class WarningTip {
  @Input({ required: true }) text = '';
  /** `danger` (red) flags suspicious data, `warn` (yellow) flags missing data. */
  @Input() variant: 'danger' | 'warn' = 'danger';

  @HostBinding('class.warn') protected get isWarn(): boolean {
    return this.variant === 'warn';
  }

  @HostBinding('class.open') protected open = false;

  @HostListener('click', ['$event'])
  protected onClick(event: Event) {
    event.stopPropagation();

    if (this.open) {
      this.close();
      return;
    }

    openTip?.close();
    this.open = true;
    openTip = this;
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  protected close() {
    this.open = false;
    if (openTip === this) {
      openTip = null;
    }
  }
}
