import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthApi } from '../../../core/auth/auth-api';
import { AuthStore } from '../../../core/auth/auth-store';
import { NotificationService } from '../../../shared/services/notification.service';

type VerifyState = 'checking' | 'invalid';

@Component({
  selector: 'app-verify-email',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './verify-email.html',
  styleUrl: '../login/login.css',
})
export class VerifyEmail implements OnInit {
  private authApi = inject(AuthApi);
  private authStore = inject(AuthStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);

  readonly state = signal<VerifyState>('checking');
  readonly isSubmitting = signal(false);
  readonly isResent = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!token) {
      this.state.set('invalid');
      return;
    }

    this.authStore.verifyEmail(token).subscribe({
      next: () => {
        this.notifications.notifySuccess('auth.verifyEmail.success');
        this.router.navigate(['/garage'], { replaceUrl: true });
      },
      // A rate-limit toast is already shown by the interceptor; the page still has to leave
      // the "checking" state, so every failure falls through to the invalid-link view.
      error: () => this.state.set('invalid'),
    });
  }

  resend() {
    if (this.form.invalid || this.isSubmitting()) return;

    const { email } = this.form.value;
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';

    this.isSubmitting.set(true);

    this.authApi.resendVerification(email!, lang).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isResent.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 429) return;
        this.notifications.notifyError('auth.verifyEmail.errors.resendFailed');
      },
    });
  }
}
