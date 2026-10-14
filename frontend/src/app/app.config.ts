import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';

import { routes } from './app.routes';
import { AppTitleStrategy } from './core/seo/app-title.strategy';
import { SeoService } from './core/seo/seo.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth-interceptor';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  ChartNoAxesCombined,
  Cog,
  Disc,
  Droplet,
  Droplets,
  File,
  Fuel,
  LucideIconProvider,
  LUCIDE_ICONS,
  Search,
  Share,
  Sparkles,
  ToolCase,
  Toolbox,
  Wrench,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: TitleStrategy, useExisting: AppTitleStrategy },
    provideAppInitializer(() => inject(SeoService).init()),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Search,
        Droplet,
        Droplets,
        Fuel,
        Wrench,
        Toolbox,
        Cog,
        Disc,
        Sparkles,
        ToolCase,
        ChartNoAxesCombined,
        Share,
        File,
      }),
    },
  ],
};
