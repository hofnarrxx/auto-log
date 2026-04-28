import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthApi } from '../../../core/auth/auth-api';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './register.html',
  styleUrl: '../login/login.css',
})
export class Register {
  private authApi = inject(AuthApi);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  register() {
    if (this.form.invalid) return;

    const { email, password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) return;

    this.authApi.register(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        if (err.status === 409) {
          alert(this.translate.instant('auth.register.errors.emailExists'));
        } else {
          alert(this.translate.instant('auth.register.errors.registrationFailed'));
        }
      }
    });
  }
}
