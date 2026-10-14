import { Injectable, Injector, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DEFAULT_TITLE_KEY } from './route-seo.model';

const SUFFIX = ' | AutoLog';

/**
 * Route `title` values are translation keys. The page title is re-translated whenever
 * the language changes. Routes without a title use the full site title (`seo.defaultTitle`);
 * all other pages get " | AutoLog" appended.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  // Resolved lazily on purpose. The Router instantiates this strategy, and TranslateService's
  // first HTTP request goes through an interceptor that injects the Router. Injecting
  // TranslateService eagerly here creates a circular dependency that silently breaks the
  // initial (English) translations.
  private readonly injector = inject(Injector);

  private sub?: Subscription;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.sub?.unsubscribe();

    const routeKey = this.buildTitle(snapshot);
    const key = routeKey ?? DEFAULT_TITLE_KEY;
    const suffix = routeKey ? SUFFIX : '';

    this.sub = this.injector
      .get(TranslateService)
      .stream(key)
      .subscribe((text: unknown) => {
        // Until translations load, stream() yields the key itself - don't show that.
        if (typeof text === 'string' && text && text !== key) {
          this.title.setTitle(`${text}${suffix}`);
        }
      });
  }
}
