import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth-store';
import { NotificationService } from '../../../shared/services/notification.service';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import {
  PASSWORD_MIN_LENGTH,
  passwordStrengthValidator,
} from '../../../shared/utils/password.validator';
import { PasswordField } from '../../../shared/ui/password-field/password-field';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, PasswordField],
  templateUrl: './register.html',
  styleUrl: '../login/login.css',
})
export class Register {
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), passwordStrengthValidator],
    ],
    confirmPassword: ['', Validators.required],
  });

  register() {
    if (this.form.invalid) return;

    const { email, password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) return;

    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';

    this.authStore.register(email!, password!, lang).subscribe({
      next: () => this.router.navigate(['/verify-email/sent'], { state: { email } }),
      error: (err) => {
        if (err.status === 429) return;
        this.notifications.notifyHttpError(err, {
          fallback: 'auth.register.errors.registrationFailed',
          byStatus: {
            409: 'auth.register.errors.emailExists',
            400: 'auth.register.errors.passwordWeak',
          },
        });
      },
    });
  }

  googleLogin() {
    window.location.href = `${this.apiBaseUrl}/oauth2/authorization/google`;
  }
}
