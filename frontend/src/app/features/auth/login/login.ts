import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../../core/auth/auth-api';


@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authApi = inject(AuthApi);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  login() {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;

    this.authApi.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => alert('Invalid credentials')
    });
  }

  googleLogin() {
    window.location.href =
      'http://localhost:8080/oauth2/authorization/google';
  }
}
