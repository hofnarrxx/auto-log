import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthApi } from '../../../core/auth/auth-api';
import { NotificationService } from '../../../shared/services/notification.service';
import {
  PASSWORD_MIN_LENGTH,
  passwordStrengthValidator,
  passwordsMatchValidator,
} from '../../../shared/utils/password.validator';

type TokenState = 'checking' | 'valid' | 'invalid';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './reset-password.html',
  styleUrl: '../login/login.css',
})
export class ResetPassword implements OnInit {
  private authApi = inject(AuthApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;
  readonly tokenState = signal<TokenState>('checking');
  readonly isSubmitting = signal(false);

  private token = '';

  form = this.fb.group(
    {
      password: [
        '',
        [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), passwordStrengthValidator],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.tokenState.set('invalid');
      return;
    }

    this.authApi.validateResetToken(this.token).subscribe({
      next: () => this.tokenState.set('valid'),
      error: () => this.tokenState.set('invalid'),
    });
  }

  submit() {
    if (this.form.invalid || this.isSubmitting()) return;

    const { password } = this.form.value;
    this.isSubmitting.set(true);

    this.authApi.resetPassword(this.token, password!).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notifications.notifySuccess('auth.resetPassword.success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notifications.notifyHttpError(err, {
          fallback: 'auth.resetPassword.errors.resetFailed',
          byStatus: {
            400: 'auth.resetPassword.errors.invalidToken',
          },
        });
      },
    });
  }
}
