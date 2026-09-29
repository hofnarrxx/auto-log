import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthApi } from '../../../core/auth/auth-api';
import { AuthStore } from '../../../core/auth/auth-store';
import { NotificationService } from '../../../shared/services/notification.service';
import { PASSWORD_MIN_LENGTH } from '../../../shared/utils/password.validator';

type LinkState = 'checking' | 'ready';

@Component({
  selector: 'app-link-google',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './link-google.html',
  styleUrl: '../login/login.css',
})
export class LinkGoogle implements OnInit {
  private authApi = inject(AuthApi);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;
  readonly linkState = signal<LinkState>('checking');
  readonly email = signal('');
  readonly isSubmitting = signal(false);

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
  });

  ngOnInit(): void {
    this.authApi.pendingGoogleLink().subscribe({
      next: (response) => {
        this.email.set(response.email);
        this.linkState.set('ready');
      },
      error: () => {
        this.notifications.notifyError('auth.linkGoogle.errors.expired');
        this.router.navigate(['/login']);
      },
    });
  }

  submit() {
    if (this.form.invalid || this.isSubmitting()) return;

    const { password } = this.form.value;
    this.isSubmitting.set(true);

    this.authStore.linkGoogle(password!).subscribe({
      next: () => this.router.navigate(['/garage']),
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 429) return;
        if (err.status === 400 || err.status === 409) {
          this.notifications.notifyHttpError(err, {
            fallback: 'auth.linkGoogle.errors.expired',
            byStatus: {
              409: 'auth.linkGoogle.errors.alreadyLinked',
            },
          });
          this.router.navigate(['/login']);
          return;
        }
        this.notifications.notifyHttpError(err, {
          fallback: 'auth.linkGoogle.errors.invalidPassword',
          byStatus: {
            401: 'auth.linkGoogle.errors.invalidPassword',
          },
        });
      },
    });
  }

  cancel() {
    if (this.isSubmitting()) return;
    this.authApi.cancelGoogleLink().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
