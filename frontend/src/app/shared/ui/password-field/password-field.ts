import { Component, ElementRef, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Wraps a projected `<input type="password">` and adds a show/hide ("eye") toggle on its right.
 * The input itself stays in the parent's template, so its form binding, attributes and styling
 * are untouched; this component only flips the input's `type` between `password` and `text`.
 *
 * ```html
 * <app-password-field>
 *   <input type="password" formControlName="password" />
 * </app-password-field>
 * ```
 */
@Component({
  selector: 'app-password-field',
  imports: [LucideAngularModule, TranslateModule],
  template: `
    <ng-content />
    <button
      type="button"
      class="toggle"
      [attr.aria-label]="(visible() ? 'common.hidePassword' : 'common.showPassword') | translate"
      [attr.aria-pressed]="visible()"
      (mousedown)="$event.preventDefault()"
      (click)="toggle()"
    >
      <lucide-icon
        [name]="visible() ? 'eye-off' : 'eye'"
        size="18"
        strokeWidth="2"
        aria-hidden="true"
      ></lucide-icon>
    </button>
  `,
  styleUrl: './password-field.css',
})
export class PasswordField {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly visible = signal(false);

  protected toggle() {
    const visible = !this.visible();
    this.visible.set(visible);

    const input = this.host.nativeElement.querySelector('input');
    if (input) {
      input.type = visible ? 'text' : 'password';
    }
  }
}
