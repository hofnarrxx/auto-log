import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    title: 'titles.login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'titles.register',
    loadComponent: () => import('./register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    title: 'titles.forgotPassword',
    loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    title: 'titles.resetPassword',
    loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'verify-email',
    title: 'titles.verifyEmail',
    loadComponent: () => import('./verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'verify-email/sent',
    title: 'titles.verifyEmail',
    loadComponent: () =>
      import('./verify-email-sent/verify-email-sent').then((m) => m.VerifyEmailSent),
  },
  {
    path: 'link-google',
    title: 'titles.linkGoogle',
    loadComponent: () => import('./link-google/link-google').then((m) => m.LinkGoogle),
  },
];
