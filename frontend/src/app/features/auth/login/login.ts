import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth-store';
import { NotificationService } from '../../../shared/services/notification.service';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { PASSWORD_MIN_LENGTH } from '../../../shared/utils/password.validator';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
  });

  login() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.authStore.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        if (err.status === 429) return;
        this.notifications.notifyError('auth.login.errors.invalidCredentials');
      },
    });
  }

  googleLogin() {
    window.location.href = `${this.apiBaseUrl}/oauth2/authorization/google`;
  }
}
