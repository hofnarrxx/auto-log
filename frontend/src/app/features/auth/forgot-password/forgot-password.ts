import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthApi } from '../../../core/auth/auth-api';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './forgot-password.html',
  styleUrl: '../login/login.css',
})
export class ForgotPassword {
  private authApi = inject(AuthApi);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);

  readonly isSubmitting = signal(false);
  readonly isSent = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit() {
    if (this.form.invalid || this.isSubmitting()) return;

    const { email } = this.form.value;
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';

    this.isSubmitting.set(true);

    this.authApi.requestPasswordReset(email!, lang).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSent.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notifications.notifyError('auth.forgotPassword.errors.requestFailed');
      },
    });
  }
}
