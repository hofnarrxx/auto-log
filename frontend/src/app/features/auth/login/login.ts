import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthApi } from '../../../core/auth/auth-api';
import { NotificationService } from '../../../shared/services/notification.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authApi = inject(AuthApi);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  login() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.authApi.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.notifications.notifyError('auth.login.errors.invalidCredentials'),
    });
  }

  googleLogin() {
    window.location.href = `${environment.apiBaseUrl}/oauth2/authorization/google`;
  }
}
