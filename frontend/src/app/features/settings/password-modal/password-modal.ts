import { Component, EventEmitter, Output, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth-store';
import { NotificationService } from '../../../shared/services/notification.service';
import { Modal } from '../../../shared/ui/modal/modal';
import {
  PASSWORD_MIN_LENGTH,
  passwordStrengthValidator,
  passwordsMatchValidator,
} from '../../../shared/utils/password.validator';

/**
 * Self-contained dialog for changing the account password, or setting a first one on a
 * Google-only account. Settings only decides when to show it; it closes itself on success.
 */
@Component({
  selector: 'app-password-modal',
  imports: [Modal, ReactiveFormsModule, TranslateModule],
  templateUrl: './password-modal.html',
  styleUrl: './password-modal.css',
})
export class PasswordModal {
  private readonly authStore = inject(AuthStore);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  @Output() closed = new EventEmitter<void>();

  /** True: change the existing password. False (Google-only account): set a first one. */
  protected readonly hasLocalLogin = this.authStore.hasLocalLogin;
  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;
  readonly isSubmitting = signal(false);

  /**
   * One form serves both modes. `currentPassword` only applies when the account already has a
   * local login, so it is disabled (and ignored by validation) for Google-only accounts. The
   * new password control is named `password` because `passwordsMatchValidator` expects it.
   */
  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      password: [
        '',
        [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), passwordStrengthValidator],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  constructor() {
    effect(() => {
      const control = this.passwordForm.controls.currentPassword;
      if (this.hasLocalLogin()) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
      this.passwordForm.updateValueAndValidity({ emitEvent: false });
    });
  }

  close() {
    this.closed.emit();
  }

  submitPassword() {
    if (this.passwordForm.invalid || this.isSubmitting() || this.authStore.isDemo()) return;

    const { currentPassword, password } = this.passwordForm.getRawValue();
    const isChange = this.hasLocalLogin();
    const request = isChange
      ? this.authStore.changePassword(currentPassword, password)
      : this.authStore.setPassword(password);

    this.isSubmitting.set(true);

    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notifications.notifySuccess(
          isChange ? 'settings.password.changeSuccess' : 'settings.password.setSuccess'
        );
        this.passwordForm.reset();
        this.close();
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.handlePasswordError(err, isChange);
      },
    });
  }

  private handlePasswordError(err: unknown, isChange: boolean) {
    // The interceptor already shows the rate-limit message.
    if (err instanceof HttpErrorResponse && err.status === 429) return;

    if (
      err instanceof HttpErrorResponse &&
      err.status === 400 &&
      err.error?.error === 'WRONG_PASSWORD'
    ) {
      const control = this.passwordForm.controls.currentPassword;
      control.setErrors({ wrongPassword: true });
      control.markAsTouched();
      return;
    }

    this.notifications.notifyHttpError(err, {
      fallback: isChange
        ? 'settings.password.errors.changeFailed'
        : 'settings.password.errors.setFailed',
      byStatus: { 403: 'demo.readOnly' },
    });
  }
}
