import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthStore } from '../../core/auth/auth-store';
import { LanguageService } from './language.service';
import { NotificationService } from './notification.service';

describe('LanguageService', () => {
  const STORAGE_KEY = 'autolog-language';
  let translate: jasmine.SpyObj<TranslateService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let isDemo: ReturnType<typeof signal<boolean>>;
  let startDemo: jasmine.Spy;
  let assign: jasmine.Spy;
  let router: { url: string };

  function createService(): LanguageService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translate },
        { provide: NotificationService, useValue: notifications },
        { provide: AuthStore, useValue: { isDemo: isDemo.asReadonly(), startDemo } },
        { provide: DOCUMENT, useValue: { defaultView: { location: { assign } } } },
        { provide: Router, useValue: router },
      ],
    });
    return TestBed.inject(LanguageService);
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    translate = jasmine.createSpyObj('TranslateService', ['use']);
    notifications = jasmine.createSpyObj('NotificationService', ['notifyError']);
    isDemo = signal(false);
    startDemo = jasmine.createSpy('startDemo').and.returnValue(of(undefined));
    assign = jasmine.createSpy('assign');
    router = { url: '/' };
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('defaults to English when nothing is stored', () => {
    const service = createService();

    expect(service.selectedLanguage()).toBe('en');
  });

  it('loads a stored language', () => {
    localStorage.setItem(STORAGE_KEY, 'pl');
    const service = createService();

    expect(service.selectedLanguage()).toBe('pl');
  });

  it('ignores invalid stored languages', () => {
    localStorage.setItem(STORAGE_KEY, 'de');
    const service = createService();

    expect(service.selectedLanguage()).toBe('en');
  });

  it('persists and applies the language when the session is not demo', () => {
    const service = createService();

    service.setLanguage('pl');

    expect(service.selectedLanguage()).toBe('pl');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('pl');
    expect(translate.use).toHaveBeenCalledWith('pl');
    expect(startDemo).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('ignores unsupported languages', () => {
    const service = createService();

    service.setLanguage('de');

    expect(service.selectedLanguage()).toBe('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(translate.use).not.toHaveBeenCalled();
  });

  it('applies a UI-only language switch on the landing page even in demo mode', () => {
    isDemo.set(true);
    router.url = '/';
    const service = createService();

    service.setLanguage('pl');

    expect(translate.use).toHaveBeenCalledWith('pl');
    expect(startDemo).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('re-issues the demo session and hard-reloads the garage on language change in the app', () => {
    isDemo.set(true);
    router.url = '/settings';
    const service = createService();

    service.setLanguage('pl');

    expect(startDemo).toHaveBeenCalledWith('pl');
    expect(assign).toHaveBeenCalledWith('/garage');
    expect(translate.use).not.toHaveBeenCalled();
  });

  it('falls back to a UI-only language switch when demo re-issue fails', () => {
    isDemo.set(true);
    router.url = '/settings';
    startDemo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const service = createService();

    service.setLanguage('pl');

    expect(assign).not.toHaveBeenCalled();
    expect(translate.use).toHaveBeenCalledWith('pl');
    expect(notifications.notifyError).toHaveBeenCalledWith('demo.errors.startFailed');
  });
});
