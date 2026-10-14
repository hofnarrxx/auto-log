import { Routes } from '@angular/router';
import { RouteSeo } from '../../core/seo/route-seo.model';

export const legalRoutes: Routes = [
  {
    path: 'privacy',
    title: 'titles.privacy',
    data: {
      legal: 'privacy',
      seo: {
        indexable: true,
        canonicalPath: '/privacy',
        descriptionKey: 'legal.privacy.description',
      } satisfies RouteSeo,
    },
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
  },
  {
    path: 'terms',
    title: 'titles.terms',
    data: {
      legal: 'terms',
      seo: {
        indexable: true,
        canonicalPath: '/terms',
        descriptionKey: 'legal.terms.description',
      } satisfies RouteSeo,
    },
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
  },
];
