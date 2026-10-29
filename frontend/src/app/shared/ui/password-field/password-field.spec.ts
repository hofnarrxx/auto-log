import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Eye, EyeOff, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { PasswordField } from './password-field';

@Component({
  imports: [PasswordField],
  template: `
    <app-password-field>
      <input type="password" />
    </app-password-field>
  `,
})
class Host {}

describe('PasswordField', () => {
  let fixture: ComponentFixture<Host>;

  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const toggle = () => fixture.nativeElement.querySelector('.toggle') as HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Host, TranslateModule.forRoot()],
      providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Eye, EyeOff }) },
      ],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('starts with the password hidden and the "eye" icon', () => {
    expect(input().type).toBe('password');
    expect(fixture.nativeElement.querySelector('.lucide-eye')).toBeTruthy();
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the password and switches to the "eye-off" icon when toggled', () => {
    toggle().click();
    fixture.detectChanges();

    expect(input().type).toBe('text');
    expect(fixture.nativeElement.querySelector('.lucide-eye-off')).toBeTruthy();
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
  });

  it('hides the password again on a second toggle', () => {
    toggle().click();
    fixture.detectChanges();
    toggle().click();
    fixture.detectChanges();

    expect(input().type).toBe('password');
    expect(fixture.nativeElement.querySelector('.lucide-eye')).toBeTruthy();
  });
});
