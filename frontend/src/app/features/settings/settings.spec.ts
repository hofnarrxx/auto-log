import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Eye, EyeOff, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { AuthStore } from '../../core/auth/auth-store';
import { LanguageService } from '../../core/i18n/language.service';
import { CurrencyService } from '../../shared/services/currency.service';
import { NotificationService } from '../../shared/services/notification.service';
import { Settings } from './settings';

describe('Settings password entry point', () => {
  const isDemo = signal(false);
  const hasLocalLogin = signal(true);

  let fixture: ComponentFixture<Settings>;

  function createComponent() {
    fixture = TestBed.createComponent(Settings);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function query(selector: string): HTMLElement | null {
    return (document.body as HTMLElement).querySelector(selector);
  }

  function openButton(): HTMLButtonElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.password-open-btn');
  }

  beforeEach(() => {
    isDemo.set(false);
    hasLocalLogin.set(true);

    TestBed.configureTestingModule({
      imports: [Settings, TranslateModule.forRoot()],
      providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Eye, EyeOff }) },
        {
          provide: AuthStore,
          useValue: {
            isDemo,
            hasLocalLogin,
            changePassword: () => undefined,
            setPassword: () => undefined,
          },
        },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj('NotificationService', [
            'notifySuccess',
            'notifyHttpError',
          ]),
        },
        {
          provide: CurrencyService,
          useValue: { selectedCurrency: signal('EUR'), setSelectedCurrency: () => undefined },
        },
        {
          provide: LanguageService,
          useValue: { selectedLanguage: signal('en'), setLanguage: () => undefined },
        },
      ],
    });
  });

  afterEach(() => fixture?.destroy());

  it('shows no password form inline, only a button', () => {
    createComponent();

    expect(openButton()).not.toBeNull();
    expect(query('#new-password')).toBeNull();
    expect(query('app-password-modal')).toBeNull();
  });

  it('labels the button "change" for accounts with a local login', () => {
    createComponent();

    expect(openButton()?.textContent).toContain('settings.password.changeSubmit');
  });

  it('labels the button "set" for Google-only accounts', () => {
    hasLocalLogin.set(false);

    createComponent();

    expect(openButton()?.textContent).toContain('settings.password.setSubmit');
  });

  it('opens the password modal on click and closes it again', () => {
    const component = createComponent();

    openButton()!.click();
    fixture.detectChanges();

    expect(component.isPasswordModalOpen()).toBe(true);
    expect(query('app-password-modal #new-password')).not.toBeNull();

    (query('app-password-modal .cancel-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.isPasswordModalOpen()).toBe(false);
    expect(query('app-password-modal')).toBeNull();
  });

  it('hides the button for a demo session', () => {
    isDemo.set(true);

    createComponent();

    expect(openButton()).toBeNull();
  });
});
