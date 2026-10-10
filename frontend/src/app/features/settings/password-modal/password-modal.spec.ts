import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth-store';
import { NotificationService } from '../../../shared/services/notification.service';
import { PasswordModal } from './password-modal';

describe('PasswordModal', () => {
  const isDemo = signal(false);
  const hasLocalLogin = signal(true);

  let authStore: {
    isDemo: typeof isDemo;
    hasLocalLogin: typeof hasLocalLogin;
    changePassword: jasmine.Spy;
    setPassword: jasmine.Spy;
  };
  let notifications: jasmine.SpyObj<NotificationService>;
  let fixture: ComponentFixture<PasswordModal>;
  let closed: jasmine.Spy;

  function createComponent() {
    fixture = TestBed.createComponent(PasswordModal);
    closed = jasmine.createSpy('closed');
    fixture.componentInstance.closed.subscribe(closed);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function element(selector: string): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }

  beforeEach(() => {
    isDemo.set(false);
    hasLocalLogin.set(true);

    authStore = {
      isDemo,
      hasLocalLogin,
      changePassword: jasmine.createSpy('changePassword').and.returnValue(of(undefined)),
      setPassword: jasmine.createSpy('setPassword').and.returnValue(of(undefined)),
    };
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'notifySuccess',
      'notifyHttpError',
    ]);

    TestBed.configureTestingModule({
      imports: [PasswordModal, TranslateModule.forRoot()],
      providers: [
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notifications },
      ],
    });
  });

  it('asks for the current password when the account has a local login', () => {
    createComponent();

    expect(element('#current-password')).not.toBeNull();
    expect(element('.password-description')).toBeNull();
  });

  it('does not ask for a current password on a Google-only account', () => {
    hasLocalLogin.set(false);

    const component = createComponent();
    component.passwordForm.patchValue({ password: 'NewPass1!', confirmPassword: 'NewPass1!' });

    expect(element('#current-password')).toBeNull();
    expect(element('.password-description')).not.toBeNull();
    expect(component.passwordForm.controls.currentPassword.disabled).toBe(true);
    expect(component.passwordForm.valid).toBe(true);
  });

  it('requires the current password again once the account becomes local', () => {
    hasLocalLogin.set(false);
    const component = createComponent();

    hasLocalLogin.set(true);
    fixture.detectChanges();
    component.passwordForm.patchValue({ password: 'NewPass1!', confirmPassword: 'NewPass1!' });

    expect(component.passwordForm.controls.currentPassword.enabled).toBe(true);
    expect(component.passwordForm.valid).toBe(false);
  });

  it('changes the password, then closes on success', () => {
    const component = createComponent();
    component.passwordForm.setValue({
      currentPassword: 'OldPass1!',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    });

    component.submitPassword();

    expect(authStore.changePassword).toHaveBeenCalledWith('OldPass1!', 'NewPass1!');
    expect(authStore.setPassword).not.toHaveBeenCalled();
    expect(notifications.notifySuccess).toHaveBeenCalledWith('settings.password.changeSuccess');
    expect(component.isSubmitting()).toBe(false);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('sets a first password for a Google-only account', () => {
    hasLocalLogin.set(false);
    const component = createComponent();
    component.passwordForm.patchValue({ password: 'NewPass1!', confirmPassword: 'NewPass1!' });

    component.submitPassword();

    expect(authStore.setPassword).toHaveBeenCalledWith('NewPass1!');
    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(notifications.notifySuccess).toHaveBeenCalledWith('settings.password.setSuccess');
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('does not submit when the confirmation does not match', () => {
    const component = createComponent();
    component.passwordForm.setValue({
      currentPassword: 'OldPass1!',
      password: 'NewPass1!',
      confirmPassword: 'Different1!',
    });

    component.submitPassword();

    expect(component.passwordForm.controls.confirmPassword.errors?.['passwordMismatch']).toBe(true);
    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();
  });

  it('flags the current password field and stays open when the server says it is wrong', () => {
    authStore.changePassword.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'WRONG_PASSWORD' } }))
    );
    const component = createComponent();
    component.passwordForm.setValue({
      currentPassword: 'Wrong1!',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    });

    component.submitPassword();

    const control = component.passwordForm.controls.currentPassword;
    expect(control.errors?.['wrongPassword']).toBe(true);
    expect(control.touched).toBe(true);
    expect(notifications.notifyHttpError).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
    expect(closed).not.toHaveBeenCalled();
  });

  it('shows a generic error for other failures', () => {
    const failure = new HttpErrorResponse({ status: 500 });
    authStore.changePassword.and.returnValue(throwError(() => failure));
    const component = createComponent();
    component.passwordForm.setValue({
      currentPassword: 'OldPass1!',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    });

    component.submitPassword();

    expect(notifications.notifyHttpError).toHaveBeenCalledWith(failure, {
      fallback: 'settings.password.errors.changeFailed',
      byStatus: { 403: 'demo.readOnly' },
    });
    expect(closed).not.toHaveBeenCalled();
  });

  it('leaves rate-limit errors to the interceptor', () => {
    authStore.changePassword.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 429 }))
    );
    const component = createComponent();
    component.passwordForm.setValue({
      currentPassword: 'OldPass1!',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    });

    component.submitPassword();

    expect(notifications.notifyHttpError).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
    expect(closed).not.toHaveBeenCalled();
  });

  it('closes when cancel is clicked', () => {
    createComponent();

    (element('.cancel-btn') as HTMLButtonElement).click();

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
