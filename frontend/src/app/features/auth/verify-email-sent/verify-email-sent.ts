import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthApi } from '../../../core/auth/auth-api';
import { NotificationService } from '../../../shared/services/notification.service';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-verify-email-sent',
  imports: [RouterLink, TranslateModule],
  templateUrl: './verify-email-sent.html',
  styleUrl: '../login/login.css',
})
export class VerifyEmailSent implements OnInit {
  private authApi = inject(AuthApi);
  private router = inject(Router);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly email = signal('');
  readonly isSubmitting = signal(false);
  /** Seconds left before the resend button is usable again; 0 means it can be clicked. */
  readonly cooldown = signal(0);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopCooldown());
  }

  ngOnInit(): void {
    // The email is handed over through router state (set by register/login) and survives a reload.
    const email = history.state?.email;

    if (typeof email !== 'string' || !email) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.email.set(email);
  }

  resend() {
    if (this.isSubmitting() || this.cooldown() > 0 || !this.email()) return;

    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    this.isSubmitting.set(true);

    this.authApi.resendVerification(this.email(), lang).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notifications.notifySuccess('auth.verifyEmail.resent');
        this.startCooldown();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 429) return;
        this.notifications.notifyError('auth.verifyEmail.errors.resendFailed');
      },
    });
  }

  private startCooldown(): void {
    this.stopCooldown();
    this.cooldown.set(RESEND_COOLDOWN_SECONDS);

    this.cooldownTimer = setInterval(() => {
      const remaining = this.cooldown() - 1;
      this.cooldown.set(Math.max(remaining, 0));

      if (remaining <= 0) {
        this.stopCooldown();
      }
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer !== null) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}
